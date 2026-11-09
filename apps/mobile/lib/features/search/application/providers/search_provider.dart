import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/property_model.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

class SearchFilterState {
  final String keyword;
  final String? localityId;
  final String? localityName;
  final PropertyType? propertyType;
  final int? minRent;
  final int? maxRent;
  final int? minBedrooms;

  SearchFilterState({
    this.keyword = '',
    this.localityId,
    this.localityName,
    this.propertyType,
    this.minRent,
    this.maxRent,
    this.minBedrooms,
  });

  SearchFilterState copyWith({
    String? keyword,
    String? localityId,
    String? localityName,
    PropertyType? propertyType,
    int? minRent,
    int? maxRent,
    int? minBedrooms,
  }) {
    return SearchFilterState(
      keyword: keyword ?? this.keyword,
      localityId: localityId ?? this.localityId,
      localityName: localityName ?? this.localityName,
      propertyType: propertyType ?? this.propertyType,
      minRent: minRent ?? this.minRent,
      maxRent: maxRent ?? this.maxRent,
      minBedrooms: minBedrooms ?? this.minBedrooms,
    );
  }
}

class SearchResultsState {
  final List<PropertyModel> results;
  final bool isLoading;
  final String? error;
  final SearchFilterState filters;

  SearchResultsState({
    this.results = const [],
    this.isLoading = false,
    this.error,
    required this.filters,
  });

  SearchResultsState copyWith({
    List<PropertyModel>? results,
    bool? isLoading,
    String? error,
    SearchFilterState? filters,
  }) {
    return SearchResultsState(
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      filters: filters ?? this.filters,
    );
  }
}

class SearchNotifier extends StateNotifier<SearchResultsState> {
  final ApiClient _apiClient;
  final TenantType _tenantType;

  SearchNotifier(this._apiClient, this._tenantType)
      : super(SearchResultsState(filters: SearchFilterState())) {
    search();
  }

  void updateFilters(SearchFilterState newFilters) {
    state = state.copyWith(filters: newFilters);
    search();
  }

  void setKeyword(String keyword) {
    state = state.copyWith(filters: state.filters.copyWith(keyword: keyword));
    search();
  }

  Future<void> search() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final eligibilityParam =
          _tenantType == TenantType.student ? 'STUDENTS_ONLY' : 'FAMILIES_ONLY';
      final tenantTypeParam =
          _tenantType == TenantType.student ? 'STUDENT' : 'FAMILY';

      final queryParams = <String, dynamic>{
        'eligibility': eligibilityParam,
        'tenantType': tenantTypeParam,
        'limit': 50,
      };

      if (state.filters.keyword.isNotEmpty) {
        queryParams['search'] = state.filters.keyword;
      }
      if (state.filters.localityName != null) {
        queryParams['localityName'] = state.filters.localityName;
      }
      if (state.filters.localityId != null) {
        queryParams['localityId'] = state.filters.localityId;
      }
      if (state.filters.minRent != null) {
        queryParams['minRent'] = state.filters.minRent;
      }
      if (state.filters.maxRent != null) {
        queryParams['maxRent'] = state.filters.maxRent;
      }
      if (state.filters.minBedrooms != null) {
        queryParams['minBedrooms'] = state.filters.minBedrooms;
      }

      final res = await _apiClient.get(
        '/properties/search',
        queryParameters: queryParams,
      );

      final data = res.data['data'] ?? res.data;
      final rawItems = data['items'] as List<dynamic>? ?? [];

      final expectedEligibility = _tenantType == TenantType.student
          ? PropertyEligibility.studentsOnly
          : PropertyEligibility.familiesOnly;

      final items = rawItems
          .map((item) => PropertyModel.fromJson(item as Map<String, dynamic>))
          .where((p) => p.eligibility == expectedEligibility)
          .toList();

      state = state.copyWith(
        isLoading: false,
        results: items,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Search failed. Please try adjusting filters.',
      );
    }
  }
}

final searchProvider =
    StateNotifierProvider.autoDispose<SearchNotifier, SearchResultsState>((ref) {
  final client = ref.watch(apiClientProvider);
  final auth = ref.watch(authProvider);
  return SearchNotifier(client, auth.currentTenantType);
});
