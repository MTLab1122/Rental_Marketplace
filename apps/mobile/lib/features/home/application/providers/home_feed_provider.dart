import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/property_model.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

class FeedState {
  final bool isLoading;
  final bool isRefreshing;
  final List<PropertyModel> properties;
  final String? selectedLocality;
  final String? nextCursor;
  final bool hasMore;
  final String? error;

  FeedState({
    this.isLoading = false,
    this.isRefreshing = false,
    this.properties = const [],
    this.selectedLocality,
    this.nextCursor,
    this.hasMore = false,
    this.error,
  });

  FeedState copyWith({
    bool? isLoading,
    bool? isRefreshing,
    List<PropertyModel>? properties,
    String? selectedLocality,
    String? nextCursor,
    bool? hasMore,
    String? error,
  }) {
    return FeedState(
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      properties: properties ?? this.properties,
      selectedLocality: selectedLocality,
      nextCursor: nextCursor ?? this.nextCursor,
      hasMore: hasMore ?? this.hasMore,
      error: error,
    );
  }
}

class HomeFeedNotifier extends StateNotifier<FeedState> {
  final ApiClient _apiClient;
  final TenantType _tenantType;

  HomeFeedNotifier(this._apiClient, this._tenantType) : super(FeedState()) {
    fetchFeed();
  }

  Future<void> fetchFeed({bool isRefresh = false}) async {
    if (isRefresh) {
      state = state.copyWith(isRefreshing: true, error: null);
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final eligibilityParam =
          _tenantType == TenantType.student ? 'STUDENTS_ONLY' : 'FAMILIES_ONLY';
      final tenantTypeParam =
          _tenantType == TenantType.student ? 'STUDENT' : 'FAMILY';

      final queryParams = <String, dynamic>{
        'eligibility': eligibilityParam,
        'tenantType': tenantTypeParam,
        'limit': 20,
      };

      if (state.selectedLocality != null && state.selectedLocality!.isNotEmpty) {
        queryParams['localityName'] = state.selectedLocality;
      }

      final response = await _apiClient.get(
        '/properties/search',
        queryParameters: queryParams,
      );

      final data = response.data['data'] ?? response.data;
      final rawItems = data['items'] as List<dynamic>? ?? [];

      // STRICT DEFENSIVE SEGREGATION:
      // Filter out any property that does not match the current tenant type eligibility
      final expectedEligibility = _tenantType == TenantType.student
          ? PropertyEligibility.studentsOnly
          : PropertyEligibility.familiesOnly;

      final parsedList = rawItems
          .map((item) => PropertyModel.fromJson(item as Map<String, dynamic>))
          .where((prop) => prop.eligibility == expectedEligibility)
          .toList();

      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        properties: parsedList,
        nextCursor: data['nextCursor'] as String?,
        hasMore: data['hasMore'] as bool? ?? false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        error: 'Failed to load properties. Tap to retry.',
      );
    }
  }

  void selectLocality(String? locality) {
    if (state.selectedLocality == locality) {
      state = FeedState(
        selectedLocality: null,
        properties: state.properties,
      );
    } else {
      state = FeedState(
        selectedLocality: locality,
        properties: state.properties,
      );
    }
    fetchFeed();
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore || state.nextCursor == null) return;

    try {
      final eligibilityParam =
          _tenantType == TenantType.student ? 'STUDENTS_ONLY' : 'FAMILIES_ONLY';
      final tenantTypeParam =
          _tenantType == TenantType.student ? 'STUDENT' : 'FAMILY';

      final queryParams = <String, dynamic>{
        'eligibility': eligibilityParam,
        'tenantType': tenantTypeParam,
        'cursor': state.nextCursor,
        'limit': 20,
      };

      if (state.selectedLocality != null) {
        queryParams['localityName'] = state.selectedLocality;
      }

      final response = await _apiClient.get(
        '/properties/search',
        queryParameters: queryParams,
      );

      final data = response.data['data'] ?? response.data;
      final rawItems = data['items'] as List<dynamic>? ?? [];

      final expectedEligibility = _tenantType == TenantType.student
          ? PropertyEligibility.studentsOnly
          : PropertyEligibility.familiesOnly;

      final moreProps = rawItems
          .map((item) => PropertyModel.fromJson(item as Map<String, dynamic>))
          .where((prop) => prop.eligibility == expectedEligibility)
          .toList();

      state = state.copyWith(
        properties: [...state.properties, ...moreProps],
        nextCursor: data['nextCursor'] as String?,
        hasMore: data['hasMore'] as bool? ?? false,
      );
    } catch (_) {}
  }
}

final homeFeedProvider =
    StateNotifierProvider.autoDispose<HomeFeedNotifier, FeedState>((ref) {
  final client = ref.watch(apiClientProvider);
  final auth = ref.watch(authProvider);
  return HomeFeedNotifier(client, auth.currentTenantType);
});
