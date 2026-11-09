import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage: storage);
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final TenantType currentTenantType;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.currentTenantType = TenantType.student,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    TenantType? currentTenantType,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      currentTenantType: currentTenantType ?? this.currentTenantType,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  AuthNotifier(this._apiClient, this._storage) : super(AuthState()) {
    init();
  }

  Future<void> init() async {
    state = state.copyWith(isLoading: true);
    try {
      final savedTenantType = await _storage.getTenantType();
      final accessToken = await _storage.getAccessToken();

      if (accessToken != null && accessToken.isNotEmpty) {
        final response = await _apiClient.get('/auth/me');
        if (response.statusCode == 200) {
          final data = response.data['data'] ?? response.data;
          final user = UserModel.fromJson(data);
          final tenantType = user.tenantType ?? savedTenantType ?? TenantType.student;

          state = state.copyWith(
            isAuthenticated: true,
            user: user,
            currentTenantType: tenantType,
            isLoading: false,
          );
          return;
        }
      }

      state = state.copyWith(
        isAuthenticated: false,
        currentTenantType: savedTenantType ?? TenantType.student,
        isLoading: false,
      );
    } catch (_) {
      state = state.copyWith(
        isAuthenticated: false,
        isLoading: false,
      );
    }
  }

  Future<bool> login(String emailOrPhone, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {
          'emailOrPhone': emailOrPhone,
          'password': password,
        },
      );

      final data = response.data['data'] ?? response.data;
      final tokens = data['tokens'];
      final user = UserModel.fromJson(data['user']);

      await _storage.saveTokens(
        accessToken: tokens['accessToken'] as String,
        refreshToken: tokens['refreshToken'] as String,
      );

      final tenantType = user.tenantType ?? state.currentTenantType;
      await _storage.saveTenantType(tenantType);

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: user,
        currentTenantType: tenantType,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      );
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    required TenantType tenantType,
    String? institutionName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final tenantTypeStr = tenantType == TenantType.student ? 'STUDENT' : 'FAMILY';
      final response = await _apiClient.post(
        '/auth/register',
        data: {
          'fullName': fullName,
          'email': email,
          'phoneNumber': phoneNumber,
          'password': password,
          'role': 'TENANT',
          'tenantType': tenantTypeStr,
          if (institutionName != null && institutionName.isNotEmpty)
            'institutionName': institutionName,
        },
      );

      final data = response.data['data'] ?? response.data;
      final tokens = data['tokens'];
      final user = UserModel.fromJson(data['user']);

      await _storage.saveTokens(
        accessToken: tokens['accessToken'] as String,
        refreshToken: tokens['refreshToken'] as String,
      );
      await _storage.saveTenantType(tenantType);

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: user,
        currentTenantType: tenantType,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Registration failed. Please check your details and try again.',
      );
      return false;
    }
  }

  Future<void> switchTenantType(TenantType newType) async {
    await _storage.saveTenantType(newType);
    state = state.copyWith(currentTenantType: newType);
  }

  Future<void> logout() async {
    try {
      await _apiClient.post('/auth/logout');
    } catch (_) {}
    await _storage.clearTokens();
    state = state.copyWith(
      isAuthenticated: false,
      user: null,
    );
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(client, storage);
});

