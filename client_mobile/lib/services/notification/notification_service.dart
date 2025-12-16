import 'dart:async';
import 'dart:convert';

import 'package:stomp_dart_client/stomp_dart_client.dart';

import '../api_client.dart';

class NotificationService {
  StompClient? _stompClient;
  Function(Map<String, dynamic>)? onNotificationReceived;
  bool _isConnected = false;
  String? _driverId;

  // Store notifications in memory (both read and unread)
  final List<Map<String, dynamic>> _notifications = [];

  /// Load persisted notifications for the current driver from the backend.
  Future<void> loadPersistedNotifications() async {
    try {
      final response = await apiClient.get('/driver/me/notifications');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        _notifications.clear();

        for (final item in data) {
          if (item is Map<String, dynamic>) {
            final notif = <String, dynamic>{
              'id': item['notificationId'],
              'message': item['message'],
              'type': item['notificationType'],
              'timestamp': item['createdAt'],
              'tripId': item['relatedEntityId'],
              'isRead': item['isRead'] == true,
            };
            _notifications.add(notif);
          }
        }
      }
    } catch (e) {
      // If loading fails, just keep whatever is currently in memory
      print('Failed to load persisted notifications: $e');
    }
  }

  Future<void> connect(String driverId) async {
    if (_isConnected && _driverId == driverId) {
      print(
        'Already connected to STOMP notification service for driver: $driverId',
      );
      return;
    }

    // Use the username directly (the service already receives the logged-in username)
    print('Using driver username as STOMP subscription ID: $driverId');
    _driverId = driverId;

    // Close existing connection if any
    disconnect();

    // Preload any persisted notifications for this driver
    await loadPersistedNotifications();

    final baseUrl = ApiClient.baseUrl.replaceFirst('/api', '');

    // Normalize to ws://host:port/ws/notifications-native (Spring STOMP endpoint)
    String wsUrl;
    if (baseUrl.startsWith('https://')) {
      wsUrl =
          baseUrl.replaceFirst('https://', 'wss://') +
          '/ws/notifications-native';
    } else if (baseUrl.startsWith('http://')) {
      wsUrl =
          baseUrl.replaceFirst('http://', 'ws://') + '/ws/notifications-native';
    } else {
      // Fallback (e.g., localhost:8080/api)
      wsUrl = 'ws://$baseUrl/ws/notifications-native';
    }

    print('DEBUG - ApiClient.baseUrl: ${ApiClient.baseUrl}');
    print('DEBUG - baseUrl (stripped /api): $baseUrl');
    print('DEBUG - Connecting to STOMP over WebSocket: $wsUrl');

    _stompClient = StompClient(
      config: StompConfig(
        url: wsUrl,
        // Spring simple broker does not require headers for anonymous connect by default
        onConnect: _onStompConnect,
        onWebSocketError: (dynamic error) {
          print('STOMP WebSocket error: $error');
          _isConnected = false;
        },
        onStompError: (StompFrame frame) {
          print('STOMP protocol error: ${frame.body}');
          _isConnected = false;
        },
        onDisconnect: (StompFrame frame) {
          print('STOMP disconnected');
          _isConnected = false;
        },
        onDebugMessage: (String msg) => print('STOMP DEBUG: $msg'),
        // Allow some timeouts but keep defaults otherwise
        connectionTimeout: const Duration(seconds: 10),
        heartbeatOutgoing: const Duration(seconds: 0),
        heartbeatIncoming: const Duration(seconds: 0),
      ),
    );

    _stompClient!.activate();

    // Give the client a brief moment to establish connection
    await Future.delayed(const Duration(seconds: 1));
  }

  void _onStompConnect(StompFrame frame) {
    _isConnected = true;
    print('Connected to STOMP notification service');

    if (_driverId == null) {
      print('WARN: _driverId is null on STOMP connect, cannot subscribe');
      return;
    }

    // Subscribe to driver-specific topic for all notifications
    final topic = '/topic/driver/$_driverId';
    print('Subscribing to STOMP topic: $topic');
    _stompClient?.subscribe(
      destination: topic,
      callback: (StompFrame frame) {
        final body = frame.body;
        if (body == null) {
          print('Received STOMP message with null body');
          return;
        }

        try {
          final decoded = jsonDecode(body);
          if (decoded is Map<String, dynamic>) {
            _handleNotification(decoded);
          }
        } catch (e) {
          print('Failed to decode STOMP message: $e');
        }
      },
    );
  }

  void _handleNotification(Map<String, dynamic> notification) {
    print('Received notification: $notification');

    // Check if this notification is already in our list (avoid duplicates)
    final message = notification['message'] ?? '';
    final timestamp = notification['timestamp']?.toString() ?? '';

    final isDuplicate = _notifications.any(
      (existing) =>
          existing['message'] == message &&
          existing['timestamp']?.toString() == timestamp,
    );

    if (!isDuplicate) {
      // If server did not send timestamp, add one to keep UI logic working
      notification.putIfAbsent(
        'timestamp',
        () => DateTime.now().toIso8601String(),
      );
      notification['isRead'] = false;

      _notifications.add(notification);

      if (onNotificationReceived != null) {
        onNotificationReceived!(notification);
      }
    }
  }

  void disconnect() {
    _stompClient?.deactivate();
    _stompClient = null;
    _isConnected = false;
    _notifications.clear();
    print('Notification service disconnected');
  }

  bool get isConnected => _isConnected;

  // Get all notifications (read + unread)
  List<Map<String, dynamic>> getAllNotifications() {
    return List.unmodifiable(_notifications);
  }

  // Get unread notifications only
  List<Map<String, dynamic>> getUnreadNotifications() {
    return List.unmodifiable(_notifications.where((n) => n['isRead'] != true));
  }

  // Mark all notifications as read (both on backend and locally)
  Future<void> markAllNotificationsAsRead() async {
    try {
      await apiClient.post('/driver/me/notifications/mark-all-read');
    } catch (e) {
      print('Failed to mark notifications as read on server: $e');
    }

    for (final n in _notifications) {
      n['isRead'] = true;
    }
  }

  // Get unread count
  int getUnreadNotificationCount() {
    return _notifications.where((n) => n['isRead'] != true).length;
  }

  // Method to manually trigger notification (for testing or server push)
  void simulateNotification(Map<String, dynamic> notification) {
    _handleNotification(notification);
  }

  // Method to receive notification from backend (called by API responses)
  void receiveNotificationFromAdmin(String type, String message) {
    final notification = {
      'message': message,
      'type': type,
      'timestamp': DateTime.now().toIso8601String(),
    };

    _handleNotification(notification);
  }
}
