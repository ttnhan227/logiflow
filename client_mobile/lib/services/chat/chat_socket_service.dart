import 'dart:async';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChatSocketService {
  StompClient? _client;
  StreamController<Map<String, dynamic>>? _chatStreamController;

  Stream<Map<String, dynamic>> get chatStream {
    _chatStreamController ??= StreamController.broadcast();
    return _chatStreamController!.stream;
  }

  Future<void> connect(String destination) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      return;
    }

    // Use same URL pattern as notification service
    final baseUrl = ApiClient.baseUrl.replaceFirst('/api', '');
    String wsUrl;
    if (baseUrl.startsWith('https://')) {
      wsUrl = baseUrl.replaceFirst('https://', 'wss://') + '/ws/notifications-native';
    } else if (baseUrl.startsWith('http://')) {
      wsUrl = baseUrl.replaceFirst('http://', 'ws://') + '/ws/notifications-native';
    } else {
      wsUrl = 'ws://$baseUrl/ws/notifications-native';
    }

    _client = StompClient(
      config: StompConfig(
        url: wsUrl,
        onConnect: (_) => _onConnect(destination),
        onWebSocketError: (dynamic err) {
          _chatStreamController?.add({
            'type': 'ERROR',
            'message': err.toString(),
          });
        },
        onStompError: (StompFrame frame) {
          _chatStreamController?.add({
            'type': 'ERROR',
            'message': frame.body ?? 'STOMP error',
          });
        },
        onDisconnect: (StompFrame frame) {
          print('Chat STOMP disconnected');
        },
        connectionTimeout: const Duration(seconds: 10),
        heartbeatOutgoing: const Duration(seconds: 0),
        heartbeatIncoming: const Duration(seconds: 0),
      ),
    );

    _client?.activate();
  }

  void _onConnect(String destination) {
    _chatStreamController ??= StreamController.broadcast();
    _client?.subscribe(
      // Allow caller to decide which topic to listen on (driver or customer)
      destination: destination,
      callback: (frame) {
        final body = frame.body;
        if (body != null) {
          _chatStreamController?.add({'type': 'CHAT', 'raw': body});
        }
      },
    );
  }

  void disconnect() {
    _client?.deactivate();
    _client = null;
    _chatStreamController?.close();
    _chatStreamController = null;
  }
}

final chatSocketService = ChatSocketService();
