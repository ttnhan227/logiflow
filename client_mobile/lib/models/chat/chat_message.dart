class ChatMessage {
  final int tripId;
  final String senderUsername;
  final String? senderRole;
  final int? recipientDriverId;
  final String content;
  final DateTime createdAt;
  final int? messageId;

  ChatMessage({
    required this.tripId,
    required this.senderUsername,
    this.senderRole,
    this.recipientDriverId,
    required this.content,
    required this.createdAt,
    this.messageId,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      messageId: json['messageId'] as int?,
      tripId: json['tripId'] as int,
      senderUsername: json['senderUsername'] as String? ?? 'Unknown',
      senderRole: json['senderRole'] as String?,
      recipientDriverId: json['recipientDriverId'] as int?,
      content: json['content'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
