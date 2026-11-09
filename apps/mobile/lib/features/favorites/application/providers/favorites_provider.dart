import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/property_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

class FavoritesState {
  final Set<String> favoriteIds;
  final List<PropertyModel> favoriteProperties;
  final bool isLoading;
  final String? error;

  FavoritesState({
    this.favoriteIds = const {},
    this.favoriteProperties = const [],
    this.isLoading = false,
    this.error,
  });

  FavoritesState copyWith({
    Set<String>? favoriteIds,
    List<PropertyModel>? favoriteProperties,
    bool? isLoading,
    String? error,
  }) {
    return FavoritesState(
      favoriteIds: favoriteIds ?? this.favoriteIds,
      favoriteProperties: favoriteProperties ?? this.favoriteProperties,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  final ApiClient _apiClient;
  final bool _isAuthenticated;

  FavoritesNotifier(this._apiClient, this._isAuthenticated)
      : super(FavoritesState()) {
    if (_isAuthenticated) {
      loadFavoriteIds();
    }
  }

  Future<void> loadFavoriteIds() async {
    try {
      final res = await _apiClient.get('/favorites/ids');
      final data = res.data['data'] ?? res.data;
      if (data is List) {
        state = state.copyWith(favoriteIds: data.map((e) => e.toString()).toSet());
      }
    } catch (_) {}
  }

  Future<void> loadFavoriteProperties() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.get('/favorites');
      final data = res.data['data'] ?? res.data;
      final rawList = data is List ? data : (data['items'] as List? ?? []);

      final properties = rawList.map((item) {
        final propMap = item['property'] != null ? item['property'] as Map<String, dynamic> : item as Map<String, dynamic>;
        return PropertyModel.fromJson(propMap);
      }).toList();

      final ids = properties.map((p) => p.id).toSet();

      state = state.copyWith(
        isLoading: false,
        favoriteProperties: properties,
        favoriteIds: ids,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load saved properties.',
      );
    }
  }

  Future<void> toggleFavorite(PropertyModel property) async {
    final isAlreadyFav = state.favoriteIds.contains(property.id);
    final previousIds = Set<String>.from(state.favoriteIds);
    final previousProps = List<PropertyModel>.from(state.favoriteProperties);

    // 1. Optimistic Update
    final updatedIds = Set<String>.from(state.favoriteIds);
    List<PropertyModel> updatedProps = List<PropertyModel>.from(state.favoriteProperties);

    if (isAlreadyFav) {
      updatedIds.remove(property.id);
      updatedProps.removeWhere((p) => p.id == property.id);
    } else {
      updatedIds.add(property.id);
      updatedProps.insert(0, property);
    }

    state = state.copyWith(favoriteIds: updatedIds, favoriteProperties: updatedProps);

    // 2. Network Call
    try {
      if (isAlreadyFav) {
        await _apiClient.delete('/properties/${property.id}/favorite');
      } else {
        await _apiClient.post('/properties/${property.id}/favorite');
      }
    } catch (e) {
      // Rollback on error
      state = state.copyWith(favoriteIds: previousIds, favoriteProperties: previousProps);
    }
  }
}

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoritesState>((ref) {
  final client = ref.watch(apiClientProvider);
  final auth = ref.watch(authProvider);
  return FavoritesNotifier(client, auth.isAuthenticated);
});
