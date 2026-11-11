import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

// --- Dashboard State & Notifier ---

class LandlordDashboardData {
  final int totalProperties;
  final int activeProperties;
  final int pendingReviewProperties;
  final int rentedProperties;
  final int unavailableProperties;
  final int totalInquiries;
  final int pendingInquiries;
  final int unreadMessages;
  final int totalViews;
  final int? averageResponseMinutes;
  final bool isIdentityVerified;
  final String verificationStatus;
  final List<dynamic> recentInquiries;

  LandlordDashboardData({
    required this.totalProperties,
    required this.activeProperties,
    required this.pendingReviewProperties,
    required this.rentedProperties,
    required this.unavailableProperties,
    required this.totalInquiries,
    required this.pendingInquiries,
    required this.unreadMessages,
    required this.totalViews,
    this.averageResponseMinutes,
    required this.isIdentityVerified,
    required this.verificationStatus,
    this.recentInquiries = const [],
  });

  factory LandlordDashboardData.fromJson(Map<String, dynamic> json) {
    final counts = json['counts'] as Map<String, dynamic>? ?? {};
    final ver = json['verification'] as Map<String, dynamic>? ?? {};
    return LandlordDashboardData(
      totalProperties: (counts['totalProperties'] as num?)?.toInt() ?? 0,
      activeProperties: (counts['activeProperties'] as num?)?.toInt() ?? 0,
      pendingReviewProperties: (counts['pendingReviewProperties'] as num?)?.toInt() ?? 0,
      rentedProperties: (counts['rentedProperties'] as num?)?.toInt() ?? 0,
      unavailableProperties: (counts['unavailableProperties'] as num?)?.toInt() ?? 0,
      totalInquiries: (counts['totalInquiries'] as num?)?.toInt() ?? 0,
      pendingInquiries: (counts['pendingInquiries'] as num?)?.toInt() ?? 0,
      unreadMessages: (counts['unreadMessages'] as num?)?.toInt() ?? 0,
      totalViews: (counts['totalViews'] as num?)?.toInt() ?? 0,
      averageResponseMinutes: (counts['averageResponseMinutes'] as num?)?.toInt(),
      isIdentityVerified: ver['isVerified'] as bool? ?? false,
      verificationStatus: ver['status'] as String? ?? 'UNVERIFIED',
      recentInquiries: json['recentInquiries'] as List<dynamic>? ?? [],
    );
  }
}

class LandlordDashboardState {
  final bool isLoading;
  final String? error;
  final LandlordDashboardData? data;

  LandlordDashboardState({this.isLoading = false, this.error, this.data});

  LandlordDashboardState copyWith({
    bool? isLoading,
    String? error,
    LandlordDashboardData? data,
  }) {
    return LandlordDashboardState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      data: data ?? this.data,
    );
  }
}

class LandlordDashboardNotifier extends StateNotifier<LandlordDashboardState> {
  final ApiClient _client;

  LandlordDashboardNotifier(this._client) : super(LandlordDashboardState()) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _client.get('/landlord/dashboard');
      final data = res.data['data'] ?? res.data;
      state = state.copyWith(
        isLoading: false,
        data: LandlordDashboardData.fromJson(data as Map<String, dynamic>),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load landlord dashboard data',
      );
    }
  }
}

final landlordDashboardProvider =
    StateNotifierProvider<LandlordDashboardNotifier, LandlordDashboardState>((ref) {
  final client = ref.watch(apiClientProvider);
  return LandlordDashboardNotifier(client);
});

// --- Landlord Properties State & Notifier ---

class LandlordPropertiesState {
  final bool isLoading;
  final String? error;
  final List<dynamic> properties;
  final String filter;

  LandlordPropertiesState({
    this.isLoading = false,
    this.error,
    this.properties = const [],
    this.filter = 'ALL',
  });

  LandlordPropertiesState copyWith({
    bool? isLoading,
    String? error,
    List<dynamic>? properties,
    String? filter,
  }) {
    return LandlordPropertiesState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      properties: properties ?? this.properties,
      filter: filter ?? this.filter,
    );
  }
}

class LandlordPropertiesNotifier extends StateNotifier<LandlordPropertiesState> {
  final ApiClient _client;

  LandlordPropertiesNotifier(this._client) : super(LandlordPropertiesState()) {
    loadProperties();
  }

  Future<void> loadProperties({String? statusFilter}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final params = <String, dynamic>{};
      if (statusFilter != null && statusFilter != 'ALL') {
        params['status'] = statusFilter;
      }
      final res = await _client.get('/landlord/properties', queryParameters: params);
      final data = res.data['data'] ?? res.data;
      final items = data is List ? data : (data['items'] as List? ?? []);
      state = state.copyWith(
        isLoading: false,
        properties: items,
        filter: statusFilter ?? state.filter,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load listings',
      );
    }
  }

  Future<bool> updateStatus(String propertyId, String newStatus) async {
    try {
      await _client.patch(
        '/landlord/properties/$propertyId/status',
        data: {'status': newStatus},
      );
      await loadProperties();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteProperty(String propertyId) async {
    try {
      await _client.delete('/landlord/properties/$propertyId');
      await loadProperties();
      return true;
    } catch (e) {
      return false;
    }
  }
}

final landlordPropertiesProvider =
    StateNotifierProvider<LandlordPropertiesNotifier, LandlordPropertiesState>((ref) {
  final client = ref.watch(apiClientProvider);
  return LandlordPropertiesNotifier(client);
});

// --- Landlord Inquiries State & Notifier ---

class LandlordInquiriesState {
  final bool isLoading;
  final String? error;
  final List<dynamic> inquiries;

  LandlordInquiriesState({
    this.isLoading = false,
    this.error,
    this.inquiries = const [],
  });

  LandlordInquiriesState copyWith({
    bool? isLoading,
    String? error,
    List<dynamic>? inquiries,
  }) {
    return LandlordInquiriesState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      inquiries: inquiries ?? this.inquiries,
    );
  }
}

class LandlordInquiriesNotifier extends StateNotifier<LandlordInquiriesState> {
  final ApiClient _client;

  LandlordInquiriesNotifier(this._client) : super(LandlordInquiriesState()) {
    loadInquiries();
  }

  Future<void> loadInquiries({String? status}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final params = <String, dynamic>{};
      if (status != null && status.isNotEmpty) {
        params['status'] = status;
      }
      final res = await _client.get('/landlord/inquiries', queryParameters: params);
      final data = res.data['data'] ?? res.data;
      final items = data is List ? data : (data['items'] as List? ?? []);
      state = state.copyWith(isLoading: false, inquiries: items);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load inquiries');
    }
  }

  Future<bool> updateStatus(String id, String status, {String? declineReason}) async {
    try {
      await _client.patch(
        '/inquiries/$id/status',
        data: {
          'status': status,
          if (declineReason != null) 'declineReason': declineReason,
        },
      );
      await loadInquiries();
      return true;
    } catch (e) {
      return false;
    }
  }
}

final landlordInquiriesProvider =
    StateNotifierProvider<LandlordInquiriesNotifier, LandlordInquiriesState>((ref) {
  final client = ref.watch(apiClientProvider);
  return LandlordInquiriesNotifier(client);
});

// --- Verification State & Notifier ---

class LandlordVerificationState {
  final bool isLoading;
  final bool isSubmitting;
  final String? error;
  final Map<String, dynamic>? verification;

  LandlordVerificationState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
    this.verification,
  });

  LandlordVerificationState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    String? error,
    Map<String, dynamic>? verification,
  }) {
    return LandlordVerificationState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
      verification: verification ?? this.verification,
    );
  }
}

class LandlordVerificationNotifier extends StateNotifier<LandlordVerificationState> {
  final ApiClient _client;

  LandlordVerificationNotifier(this._client) : super(LandlordVerificationState()) {
    loadVerification();
  }

  Future<void> loadVerification() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _client.get('/verification');
      final data = res.data['data'] ?? res.data;
      state = state.copyWith(
        isLoading: false,
        verification: data as Map<String, dynamic>?,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load verification status');
    }
  }

  Future<bool> submitVerification({
    required String cnicNumber,
    required String cnicFrontUrl,
    required String cnicBackUrl,
    required String selfieUrl,
  }) async {
    state = state.copyWith(isSubmitting: true, error: null);
    try {
      await _client.post(
        '/verification',
        data: {
          'documentType': 'CNIC',
          'documentNumber': cnicNumber,
          'frontImageUrl': cnicFrontUrl,
          'backImageUrl': cnicBackUrl,
          'selfieUrl': selfieUrl,
        },
      );
      state = state.copyWith(isSubmitting: false);
      await loadVerification();
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Failed to submit identity verification. Please verify details.',
      );
      return false;
    }
  }
}

final landlordVerificationProvider =
    StateNotifierProvider<LandlordVerificationNotifier, LandlordVerificationState>((ref) {
  final client = ref.watch(apiClientProvider);
  return LandlordVerificationNotifier(client);
});
