import 'dart:convert';
import '../api_client.dart';
import '../../models/chat/chat_message.dart';

class ChatService {
  Future<List<ChatMessage>> getTripMessages(int tripId) async {
    final response = await apiClient.get('/chat/trips/$tripId/messages');
    final data = jsonDecode(response.body) as List;
    return data.map((e) => ChatMessage.fromJson(e)).toList();
  }

  Future<ChatMessage> sendMessage({required int tripId, required String content}) async {
    final response = await apiClient.post('/chat/messages', body: {
      'tripId': tripId,
      'content': content,
    });
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return ChatMessage.fromJson(data);
  }

  Future<List<ChatMessage>> getOrderMessages(int orderId) async {
    final response = await apiClient.get('/chat/orders/$orderId/messages');
    final data = jsonDecode(response.body) as List;
    return data.map((e) => ChatMessage.fromJson(e)).toList();
  }

  Future<ChatMessage> sendOrderMessage({required int orderId, required String content}) async {
    final response = await apiClient.post('/chat/messages/customer', body: {
      'orderId': orderId,
      'content': content,
    });
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return ChatMessage.fromJson(data);
  }
}

final chatService = ChatService();
