import 'package:rental_peshawar_mobile/core/models/property_model.dart';

enum AlertFrequency {
  instant,
  daily,
  weekly,
}

extension AlertFrequencyExt on AlertFrequency {
  String get value {
    switch (this) {
      case AlertFrequency.instant:
        return 'INSTANT';
      case AlertFrequency.daily:
        return 'DAILY';
      case AlertFrequency.weekly:
        return 'WEEKLY';
    }
  }

  String get label {
    switch (this) {
      case AlertFrequency.instant:
        return 'Instant ⚡';
      case AlertFrequency.daily:
        return 'Daily Digest';
      case AlertFrequency.weekly:
        return 'Weekly Digest';
    }
  }

  static AlertFrequency fromString(String? val) {
    switch (val?.toUpperCase()) {
      case 'DAILY':
        return AlertFrequency.daily;
      case 'WEEKLY':
        return AlertFrequency.weekly;
      case 'INSTANT':
      default:
        return AlertFrequency.instant;
    }
  }
}

class SavedSearchModel {
  final String id;
  final String userId;
  final String name;
  final Map<String, dynamic> filters;
  final String filterSignature;
  final bool alertsEnabled;
  final AlertFrequency frequency;
  final DateTime? lastNotifiedAt;
  final DateTime createdAt;

  SavedSearchModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.filters,
    required this.filterSignature,
    required this.alertsEnabled,
    required this.frequency,
    this.lastNotifiedAt,
    required this.createdAt,
  });

  factory SavedSearchModel.fromJson(Map<String, dynamic> json) {
    return SavedSearchModel(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      name: json['name'] as String? ?? 'Saved Search',
      filters: json['filters'] != null ? Map<String, dynamic>.from(json['filters']) : {},
      filterSignature: json['filterSignature'] as String? ?? '',
      alertsEnabled: json['alertsEnabled'] as bool? ?? true,
      frequency: AlertFrequencyExt.fromString(json['frequency'] as String?),
      lastNotifiedAt: json['lastNotifiedAt'] != null
          ? DateTime.tryParse(json['lastNotifiedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'filters': filters,
      'filterSignature': filterSignature,
      'alertsEnabled': alertsEnabled,
      'frequency': frequency.value,
      'lastNotifiedAt': lastNotifiedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class RecommendationItemModel {
  final PropertyModel property;
  final String reason;
  final String reasonLabel;
  final int score;
  final Map<String, dynamic>? metadata;

  RecommendationItemModel({
    required this.property,
    required this.reason,
    required this.reasonLabel,
    required this.score,
    this.metadata,
  });

  factory RecommendationItemModel.fromJson(Map<String, dynamic> json) {
    return RecommendationItemModel(
      property: PropertyModel.fromJson(json['property'] as Map<String, dynamic>),
      reason: json['reason'] as String? ?? 'popular_in_locality',
      reasonLabel: json['reasonLabel'] as String? ?? 'Recommended in Peshawar',
      score: (json['score'] as num?)?.toInt() ?? 80,
      metadata: json['metadata'] != null ? Map<String, dynamic>.from(json['metadata']) : null,
    );
  }
}

class NotificationPreferenceModel {
  final bool emailAlerts;
  final bool pushAlerts;
  final bool inAppAlerts;
  final bool instantAlerts;
  final bool dailyDigest;
  final bool weeklyDigest;
  final bool recommendations;

  NotificationPreferenceModel({
    this.emailAlerts = true,
    this.pushAlerts = true,
    this.inAppAlerts = true,
    this.instantAlerts = true,
    this.dailyDigest = true,
    this.weeklyDigest = true,
    this.recommendations = true,
  });

  factory NotificationPreferenceModel.fromJson(Map<String, dynamic> json) {
    return NotificationPreferenceModel(
      emailAlerts: json['emailAlerts'] as bool? ?? true,
      pushAlerts: json['pushAlerts'] as bool? ?? true,
      inAppAlerts: json['inAppAlerts'] as bool? ?? true,
      instantAlerts: json['instantAlerts'] as bool? ?? true,
      dailyDigest: json['dailyDigest'] as bool? ?? true,
      weeklyDigest: json['weeklyDigest'] as bool? ?? true,
      recommendations: json['recommendations'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'emailAlerts': emailAlerts,
      'pushAlerts': pushAlerts,
      'inAppAlerts': inAppAlerts,
      'instantAlerts': instantAlerts,
      'dailyDigest': dailyDigest,
      'weeklyDigest': weeklyDigest,
      'recommendations': recommendations,
    };
  }
}
