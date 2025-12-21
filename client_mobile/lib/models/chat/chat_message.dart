class ChatMessage {
  final int? tripId;
  final int? orderId;
  final String senderUsername;
  final String? senderRole;
  final int? recipientDriverId;
  final int? recipientCustomerId;
  final String content;
  final DateTime createdAt;
  final int? messageId;

  ChatMessage({
    this.tripId,
    this.orderId,
    required this.senderUsername,
    this.senderRole,
    this.recipientDriverId,
    this.recipientCustomerId,
    required this.content,
    required this.createdAt,
    this.messageId,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final createdAtRaw = json['createdAt'];
    return ChatMessage(
      messageId: json['messageId'] as int?,
      tripId: json['tripId'] as int?,
      orderId: json['orderId'] as int?,
      senderUsername: json['senderUsername'] as String? ?? 'Unknown',
      senderRole: json['senderRole'] as String?,
      recipientDriverId: json['recipientDriverId'] as int?,
      recipientCustomerId: json['recipientCustomerId'] as int?,
      content: json['content'] as String? ?? '',
      createdAt: createdAtRaw is String
          ? (DateTime.tryParse(createdAtRaw) ?? DateTime.now())
          : DateTime.now(),
    );
  }
}
