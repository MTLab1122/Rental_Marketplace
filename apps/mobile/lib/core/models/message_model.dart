class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;
  final String? senderName;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    this.isRead = false,
    this.readAt,
    required this.createdAt,
    this.senderName,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    String? name;
    if (json['sender'] != null && json['sender'] is Map) {
      name = json['sender']['fullName'] as String?;
    }

    return MessageModel(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      content: json['content'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      senderName: name,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'content': content,
      'isRead': isRead,
      'readAt': readAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'senderName': senderName,
    };
  }
}

