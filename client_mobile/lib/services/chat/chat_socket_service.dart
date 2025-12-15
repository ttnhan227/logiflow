import 'dart:async';
import 'package:stomp_dart_client/stomp.dart';
import 'package:stomp_dart_client/stomp_config.dart';
import 'package:stomp_dart_client/stomp_frame.dart';
import '../api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChatSocketService {
  StompClient? _client;
  StreamController<Map<String, dynamic>>? _chatStreamController;

  Stream<Map<String, dynamic>> get chatStream {
    _chatStreamController ??= StreamController.broadcast();
    return _chatStreamController!.stream;
  }

  Future<void> connect(int driverId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      return;
    }

    // Reuse apiClient base host (without /api)
    final wsBase = ApiClient.baseImageUrl; // e.g., http://host:8080
    final url = '$wsBase/ws/notifications?token=${token.replaceAll('"', '')}';

    _client = StompClient(
      config: StompConfig.sockJS(
        url: url,
        onConnect: (_) => _onConnect(driverId),
        onWebSocketError: (dynamic err) {
          _chatStreamController?.add({'type': 'ERROR', 'message': err.toString()});
        },
        onStompError: (StompFrame frame) {
          _chatStreamController?.add({'type': 'ERROR', 'message': frame.body ?? 'STOMP error'});
        },
      ),
    );

    _client?.activate();
  }

  void _onConnect(int driverId) {
    _chatStreamController ??= StreamController.broadcast();
    _client?.subscribe(
      // Backend currently pushes chat via general driver topic
      destination: '/topic/driver/$driverId',
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
