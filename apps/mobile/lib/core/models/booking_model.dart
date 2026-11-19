enum BookingStatus {
  requested,
  landlordReviewing,
  awaitingPayment,
  paymentPending,
  confirmed,
  active,
  completed,
  cancelled,
  expired,
  disputed,
  refunded,
}

enum PaymentStatus {
  created,
  pending,
  processing,
  succeeded,
  failed,
  refunded,
  partiallyRefunded,
  cancelled,
}

enum PaymentMethodType {
  manualBankTransfer,
  jazzcash,
  easypaisa,
  stripe,
}

enum AgreementStatus {
  draft,
  sent,
  signedByTenant,
  signedByLandlord,
  active,
  expired,
  terminated,
}

enum DisputeCategory {
  paymentIssue,
  propertyNotAsDescribed,
  depositIssue,
  earlyTermination,
  safetyIssue,
  other,
}

enum DisputeStatus {
  open,
  underReview,
  resolved,
  rejected,
  escalated,
}

class BookingModel {
  final String id;
  final String inquiryId;
  final String propertyId;
  final String? propertyTitle;
  final String? propertyAddress;
  final String tenantId;
  final String landlordId;
  final BookingStatus status;
  final DateTime startDate;
  final DateTime endDate;
  final double monthlyRentPkr;
  final double securityDepositPkr;
  final double totalInitialAmountPkr;
  final DateTime? lockExpiresAt;
  final String? notes;
  final DateTime createdAt;

  BookingModel({
    required this.id,
    required this.inquiryId,
    required this.propertyId,
    this.propertyTitle,
    this.propertyAddress,
    required this.tenantId,
    required this.landlordId,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.monthlyRentPkr,
    required this.securityDepositPkr,
    required this.totalInitialAmountPkr,
    this.lockExpiresAt,
    this.notes,
    required this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as String,
      inquiryId: json['inquiryId'] as String,
      propertyId: json['propertyId'] as String,
      propertyTitle: json['property']?['title'] as String?,
      propertyAddress: json['property']?['address'] as String?,
      tenantId: json['tenantId'] as String,
      landlordId: json['landlordId'] as String,
      status: _parseBookingStatus(json['status'] as String? ?? 'REQUESTED'),
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      monthlyRentPkr: (json['monthlyRentPkr'] as num).toDouble(),
      securityDepositPkr: (json['securityDepositPkr'] as num).toDouble(),
      totalInitialAmountPkr: (json['totalInitialAmountPkr'] as num).toDouble(),
      lockExpiresAt: json['lockExpiresAt'] != null
          ? DateTime.parse(json['lockExpiresAt'] as String)
          : null,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'inquiryId': inquiryId,
      'propertyId': propertyId,
      'tenantId': tenantId,
      'landlordId': landlordId,
      'status': status.name.toUpperCase(),
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'monthlyRentPkr': monthlyRentPkr,
      'securityDepositPkr': securityDepositPkr,
      'totalInitialAmountPkr': totalInitialAmountPkr,
      'lockExpiresAt': lockExpiresAt?.toIso8601String(),
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  static BookingStatus _parseBookingStatus(String raw) {
    switch (raw.toUpperCase()) {
      case 'REQUESTED':
        return BookingStatus.requested;
      case 'LANDLORD_REVIEWING':
        return BookingStatus.landlordReviewing;
      case 'AWAITING_PAYMENT':
        return BookingStatus.awaitingPayment;
      case 'PAYMENT_PENDING':
        return BookingStatus.paymentPending;
      case 'CONFIRMED':
        return BookingStatus.confirmed;
      case 'ACTIVE':
        return BookingStatus.active;
      case 'COMPLETED':
        return BookingStatus.completed;
      case 'CANCELLED':
        return BookingStatus.cancelled;
      case 'EXPIRED':
        return BookingStatus.expired;
      case 'DISPUTED':
        return BookingStatus.disputed;
      case 'REFUNDED':
        return BookingStatus.refunded;
      default:
        return BookingStatus.requested;
    }
  }
}

class PaymentModel {
  final String id;
  final String bookingId;
  final String payerId;
  final String recipientId;
  final double amountPkr;
  final String currency;
  final PaymentStatus status;
  final PaymentMethodType methodType;
  final String? providerTransactionId;
  final String? receiptUrl;
  final DateTime createdAt;

  PaymentModel({
    required this.id,
    required this.bookingId,
    required this.payerId,
    required this.recipientId,
    required this.amountPkr,
    this.currency = 'PKR',
    required this.status,
    required this.methodType,
    this.providerTransactionId,
    this.receiptUrl,
    required this.createdAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String,
      payerId: json['payerId'] as String,
      recipientId: json['recipientId'] as String,
      amountPkr: (json['amountPkr'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'PKR',
      status: _parsePaymentStatus(json['status'] as String? ?? 'PENDING'),
      methodType: _parseMethodType(json['paymentMethodType'] as String? ?? 'MANUAL_BANK_TRANSFER'),
      providerTransactionId: json['providerTransactionId'] as String?,
      receiptUrl: json['receiptUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  static PaymentStatus _parsePaymentStatus(String raw) {
    switch (raw.toUpperCase()) {
      case 'SUCCEEDED':
        return PaymentStatus.succeeded;
      case 'PENDING':
        return PaymentStatus.pending;
      case 'FAILED':
        return PaymentStatus.failed;
      case 'REFUNDED':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.pending;
    }
  }

  static PaymentMethodType _parseMethodType(String raw) {
    switch (raw.toUpperCase()) {
      case 'JAZZCASH':
        return PaymentMethodType.jazzcash;
      case 'EASYPAISA':
        return PaymentMethodType.easypaisa;
      case 'STRIPE':
        return PaymentMethodType.stripe;
      default:
        return PaymentMethodType.manualBankTransfer;
    }
  }
}

class RentalAgreementModel {
  final String id;
  final String bookingId;
  final String title;
  final String termsHtml;
  final int version;
  final AgreementStatus status;
  final DateTime? signedByTenantAt;
  final DateTime? signedByLandlordAt;

  RentalAgreementModel({
    required this.id,
    required this.bookingId,
    required this.title,
    required this.termsHtml,
    required this.version,
    required this.status,
    this.signedByTenantAt,
    this.signedByLandlordAt,
  });

  factory RentalAgreementModel.fromJson(Map<String, dynamic> json) {
    return RentalAgreementModel(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String,
      title: json['title'] as String? ?? 'Rental Agreement',
      termsHtml: json['termsHtml'] as String? ?? '',
      version: json['version'] as int? ?? 1,
      status: _parseAgreementStatus(json['status'] as String? ?? 'DRAFT'),
      signedByTenantAt: json['signedByTenantAt'] != null
          ? DateTime.parse(json['signedByTenantAt'] as String)
          : null,
      signedByLandlordAt: json['signedByLandlordAt'] != null
          ? DateTime.parse(json['signedByLandlordAt'] as String)
          : null,
    );
  }

  static AgreementStatus _parseAgreementStatus(String raw) {
    switch (raw.toUpperCase()) {
      case 'SENT':
        return AgreementStatus.sent;
      case 'SIGNED_BY_TENANT':
        return AgreementStatus.signedByTenant;
      case 'SIGNED_BY_LANDLORD':
        return AgreementStatus.signedByLandlord;
      case 'ACTIVE':
        return AgreementStatus.active;
      case 'EXPIRED':
        return AgreementStatus.expired;
      case 'TERMINATED':
        return AgreementStatus.terminated;
      default:
        return AgreementStatus.draft;
    }
  }
}

class DisputeModel {
  final String id;
  final String bookingId;
  final String initiatorId;
  final String respondentId;
  final DisputeCategory category;
  final DisputeStatus status;
  final String description;
  final double? amountDisputedPkr;
  final String? resolution;
  final DateTime createdAt;

  DisputeModel({
    required this.id,
    required this.bookingId,
    required this.initiatorId,
    required this.respondentId,
    required this.category,
    required this.status,
    required this.description,
    this.amountDisputedPkr,
    this.resolution,
    required this.createdAt,
  });

  factory DisputeModel.fromJson(Map<String, dynamic> json) {
    return DisputeModel(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String,
      initiatorId: json['initiatorId'] as String,
      respondentId: json['respondentId'] as String,
      category: _parseCategory(json['category'] as String? ?? 'OTHER'),
      status: _parseDisputeStatus(json['status'] as String? ?? 'OPEN'),
      description: json['description'] as String? ?? '',
      amountDisputedPkr: json['amountDisputedPkr'] != null
          ? (json['amountDisputedPkr'] as num).toDouble()
          : null,
      resolution: json['resolution'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  static DisputeCategory _parseCategory(String raw) {
    switch (raw.toUpperCase()) {
      case 'PAYMENT_ISSUE':
        return DisputeCategory.paymentIssue;
      case 'PROPERTY_NOT_AS_DESCRIBED':
        return DisputeCategory.propertyNotAsDescribed;
      case 'DEPOSIT_ISSUE':
        return DisputeCategory.depositIssue;
      case 'EARLY_TERMINATION':
        return DisputeCategory.earlyTermination;
      case 'SAFETY_ISSUE':
        return DisputeCategory.safetyIssue;
      default:
        return DisputeCategory.other;
    }
  }

  static DisputeStatus _parseDisputeStatus(String raw) {
    switch (raw.toUpperCase()) {
      case 'UNDER_REVIEW':
        return DisputeStatus.underReview;
      case 'RESOLVED':
        return DisputeStatus.resolved;
      case 'REJECTED':
        return DisputeStatus.rejected;
      case 'ESCALATED':
        return DisputeStatus.escalated;
      default:
        return DisputeStatus.open;
    }
  }
}
