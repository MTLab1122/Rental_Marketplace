enum InquiryStatus {
  submitted,
  seen,
  replied,
  accepted,
  declined,
  closed,
}

class InquiryModel {
  final String id;
  final String propertyId;
  final String? propertyTitle;
  final String? propertyLocality;
  final String? propertyImageUrl;
  final String landlordId;
  final String tenantId;
  final InquiryStatus status;
  final String message;
  final int? proposedRentPkr;
  final DateTime? proposedMoveInDate;
  final String preferredContactMethod;
  final String? conversationId;
  final bool canContactWhatsapp;
  final String? whatsappUrl;
  final DateTime createdAt;

  InquiryModel({
    required this.id,
    required this.propertyId,
    this.propertyTitle,
    this.propertyLocality,
    this.propertyImageUrl,
    required this.landlordId,
    required this.tenantId,
    required this.status,
    required this.message,
    this.proposedRentPkr,
    this.proposedMoveInDate,
    required this.preferredContactMethod,
    this.conversationId,
    this.canContactWhatsapp = false,
    this.whatsappUrl,
    required this.createdAt,
  });

  String get statusLabel {
    switch (status) {
      case InquiryStatus.submitted:
        return 'Submitted';
      case InquiryStatus.seen:
        return 'Seen by Landlord';
      case InquiryStatus.replied:
        return 'Landlord Replied';
      case InquiryStatus.accepted:
        return 'Accepted';
      case InquiryStatus.declined:
        return 'Declined';
      case InquiryStatus.closed:
        return 'Closed';
    }
  }

  factory InquiryModel.fromJson(Map<String, dynamic> json) {
    InquiryStatus parseStatus(String? s) {
      switch (s) {
        case 'SEEN':
          return InquiryStatus.seen;
        case 'REPLIED':
          return InquiryStatus.replied;
        case 'ACCEPTED':
          return InquiryStatus.accepted;
        case 'DECLINED':
        case 'REJECTED':
          return InquiryStatus.declined;
        case 'CLOSED':
        case 'CANCELLED':
        case 'EXPIRED':
          return InquiryStatus.closed;
        default:
          return InquiryStatus.submitted;
      }
    }

    String? propTitle;
    String? propLocality;
    String? propImg;

    if (json['property'] != null && json['property'] is Map) {
      final p = json['property'] as Map<String, dynamic>;
      propTitle = p['title'] as String?;
      if (p['locality'] != null && p['locality'] is Map) {
        propLocality = p['locality']['name'] as String?;
      }
      if (p['images'] != null && (p['images'] as List).isNotEmpty) {
        propImg = p['images'][0]['url'] as String?;
      }
    }

    return InquiryModel(
      id: json['id'] as String,
      propertyId: json['propertyId'] as String,
      propertyTitle: propTitle ?? json['propertyTitle'] as String?,
      propertyLocality: propLocality,
      propertyImageUrl: propImg,
      landlordId: json['landlordId'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
      status: parseStatus(json['status'] as String?),
      message: json['message'] as String? ?? '',
      proposedRentPkr: (json['proposedRentPkr'] as num?)?.toInt(),
      proposedMoveInDate: json['proposedMoveInDate'] != null
          ? DateTime.tryParse(json['proposedMoveInDate'] as String)
          : null,
      preferredContactMethod: json['preferredContactMethod'] as String? ?? 'IN_APP',
      conversationId: json['conversationId'] as String? ??
          (json['conversation'] != null && json['conversation'] is Map
              ? json['conversation']['id'] as String?
              : null),
      canContactWhatsapp: json['canContactWhatsapp'] as bool? ?? false,
      whatsappUrl: json['whatsappUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}
