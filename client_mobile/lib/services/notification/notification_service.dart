import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  String? _driverId;
  Function(Map<String, dynamic>)? onNotificationReceived;
  bool _isConnected = false;
  bool _localInitialized = false;

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  // Dedicated channel for chat messages so they can be filtered separately
  static const AndroidNotificationChannel _chatChannel = AndroidNotificationChannel(
    'chat_messages',
    'Driver Chat Messages',
    description: 'Notifications for dispatcher-driver chat',
    importance: Importance.high,
  );

  Future<void> connect(String driverId) async {
    _driverId = driverId;

    // Get JWT token from shared preferences (using correct key)
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) {
      print('No JWT token found');
      return;
    }

    try {
      // Initialize local notification plugin once
      if (!_localInitialized) {
        await _initLocalNotifications();
      }

      // Notification service initialized
      // Note: For production, implement proper WebSocket/STOMP connection
      // For now, this is a placeholder that can be extended with proper STOMP client
      print('Notification service initialized for driver: $_driverId');
      _isConnected = true;
      
      // Simulate receiving notifications for testing
      // In production, this would listen to WebSocket messages
    } catch (e) {
      print('Error connecting to notification service: $e');
      _isConnected = false;
    }
  }

  void disconnect() {
    _isConnected = false;
    print('Notification service disconnected');
  }

  bool get isConnected => _isConnected;
  
  // Unified handler to fan out notifications to UI and local push
  void processNotification(Map<String, dynamic> notification) {
    // Fan out to UI layer
    if (onNotificationReceived != null) {
      onNotificationReceived!(notification);
    }

    // Show local push for chat messages (foreground/background)
    final type = (notification['type'] ?? '').toString().toUpperCase();
    if (type == 'CHAT_MESSAGE') {
      final sender = notification['sender'] ?? 'Dispatcher';
      final body = notification['message'] ?? 'New chat message';
      showLocalNotification(
        title: sender,
        body: body,
        payload: notification,
      );
    }
  }
  
  Future<void> _initLocalNotifications() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        final payload = response.payload;
        if (payload != null) {
          // Payload can be parsed by UI layer if needed
          // Keep this lightweight to avoid blocking tap handling
          try {
            // No-op: parsed in UI callback via onNotificationReceived
          } catch (_) {}
        }
      },
    );

    await _localNotifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()?.
        createNotificationChannel(_chatChannel);

    _localInitialized = true;
  }
  
  Future<void> showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? payload,
  }) async {
    if (!_localInitialized) return;

    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        _chatChannel.id,
        _chatChannel.name,
        channelDescription: _chatChannel.description,
        importance: Importance.high,
        priority: Priority.high,
        ticker: 'LogiFlow Chat',
      ),
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload?.toString(),
    );
  }
  
  // Method to manually trigger notification (for testing or polling-based approach)
  void simulateNotification(Map<String, dynamic> notification) {
    processNotification(notification);
  }
}
