import 'message_model.dart';

class ConversationParticipant {
  final String id;
  final String userId;
  final String fullName;
  final String? role;

  ConversationParticipant({
    required this.id,
    required this.userId,
    required this.fullName,
    this.role,
  });

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) {
    return ConversationParticipant(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      fullName: json['fullName'] as String? ?? 'Member',
      role: json['role'] as String?,
    );
  }
}

class ConversationModel {
  final String id;
  final String? inquiryId;
  final String? propertyId;
  final String? propertyTitle;
  final String? propertyLocality;
  final bool isBlocked;
  final String? blockedById;
  final DateTime? blockedAt;
  final MessageModel? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final bool canContactWhatsapp;
  final String? whatsappUrl;
  final List<ConversationParticipant> participants;
  final DateTime createdAt;

  ConversationModel({
    required this.id,
    this.inquiryId,
    this.propertyId,
    this.propertyTitle,
    this.propertyLocality,
    this.isBlocked = false,
    this.blockedById,
    this.blockedAt,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.canContactWhatsapp = false,
    this.whatsappUrl,
    required this.participants,
    required this.createdAt,
  });

  String getOtherParticipantName(String currentUserId) {
    final other = participants.where((p) => p.userId != currentUserId).toList();
    if (other.isNotEmpty) {
      return other.first.fullName;
    }
    return 'Verified Member';
  }

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    String? pTitle;
    String? pLocality;
    if (json['property'] != null && json['property'] is Map) {
      final p = json['property'] as Map<String, dynamic>;
      pTitle = p['title'] as String?;
      if (p['locality'] != null && p['locality'] is Map) {
        pLocality = p['locality']['name'] as String?;
      }
    }

    MessageModel? lastMsg;
    if (json['lastMessage'] != null && json['lastMessage'] is Map) {
      lastMsg = MessageModel.fromJson(json['lastMessage'] as Map<String, dynamic>);
    }

    final participantsList = <ConversationParticipant>[];
    if (json['participants'] != null && json['participants'] is List) {
      for (final part in json['participants'] as List) {
        if (part is Map<String, dynamic>) {
          participantsList.add(ConversationParticipant.fromJson(part));
        }
      }
    }

    return ConversationModel(
      id: json['id'] as String,
      inquiryId: json['inquiryId'] as String?,
      propertyId: json['propertyId'] as String?,
      propertyTitle: pTitle,
      propertyLocality: pLocality,
      isBlocked: json['isBlocked'] as bool? ?? false,
      blockedById: json['blockedById'] as String?,
      blockedAt: json['blockedAt'] != null
          ? DateTime.tryParse(json['blockedAt'] as String)
          : null,
      lastMessage: lastMsg,
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'] as String)
          : null,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      canContactWhatsapp: json['canContactWhatsapp'] as bool? ?? false,
      whatsappUrl: json['whatsappUrl'] as String?,
      participants: participantsList,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}
