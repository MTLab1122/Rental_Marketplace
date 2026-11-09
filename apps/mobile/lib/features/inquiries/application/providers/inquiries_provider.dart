import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/inquiry_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

class InquiriesState {
  final List<InquiryModel> inquiries;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;
  final String? submitSuccessMessage;

  InquiriesState({
    this.inquiries = const [],
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
    this.submitSuccessMessage,
  });

  InquiriesState copyWith({
    List<InquiryModel>? inquiries,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
    String? submitSuccessMessage,
  }) {
    return InquiriesState(
      inquiries: inquiries ?? this.inquiries,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
      submitSuccessMessage: submitSuccessMessage,
    );
  }
}

class InquiriesNotifier extends StateNotifier<InquiriesState> {
  final ApiClient _apiClient;
  final bool _isAuthenticated;

  InquiriesNotifier(this._apiClient, this._isAuthenticated)
      : super(InquiriesState()) {
    if (_isAuthenticated) {
      fetchMyInquiries();
    }
  }

  Future<void> fetchMyInquiries() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.get('/inquiries');
      final data = res.data['data'] ?? res.data;
      final rawList = data is List ? data : (data['items'] as List? ?? []);

      final list = rawList
          .map((item) => InquiryModel.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        isLoading: false,
        inquiries: list,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load inquiries. Tap to refresh.',
      );
    }
  }

  Future<bool> createInquiry({
    required String propertyId,
    required String message,
    int? proposedRentPkr,
    DateTime? proposedMoveInDate,
    String preferredContactMethod = 'PHONE',
  }) async {
    state = state.copyWith(isSubmitting: true, error: null);
    try {
      final payload = <String, dynamic>{
        'propertyId': propertyId,
        'message': message,
        'preferredContactMethod': preferredContactMethod,
      };

      if (proposedRentPkr != null && proposedRentPkr > 0) {
        payload['proposedRentPkr'] = proposedRentPkr;
      }
      if (proposedMoveInDate != null) {
        payload['proposedMoveInDate'] = proposedMoveInDate.toIso8601String().split('T').first;
      }

      await _apiClient.post('/inquiries', data: payload);
      state = state.copyWith(
        isSubmitting: false,
        submitSuccessMessage: 'Inquiry submitted successfully!',
      );

      // Refresh inquiries list
      await fetchMyInquiries();
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Failed to submit inquiry. Please try again.',
      );
      return false;
    }
  }
}

final inquiriesProvider =
    StateNotifierProvider<InquiriesNotifier, InquiriesState>((ref) {
  final client = ref.watch(apiClientProvider);
  final auth = ref.watch(authProvider);
  return InquiriesNotifier(client, auth.isAuthenticated);
});

