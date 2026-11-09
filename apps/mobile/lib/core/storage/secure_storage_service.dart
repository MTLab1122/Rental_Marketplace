import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const _keyAccessToken = 'auth_access_token';
  static const _keyRefreshToken = 'auth_refresh_token';
  static const _keyTenantType = 'user_tenant_type';
  static const _keyOnboardingDone = 'onboarding_completed';

  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await _storage.write(key: _keyAccessToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: _keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
  }

  Future<void> saveTenantType(TenantType type) async {
    final value = type == TenantType.student ? 'STUDENT' : 'FAMILY';
    await _storage.write(key: _keyTenantType, value: value);
  }

  Future<TenantType?> getTenantType() async {
    final value = await _storage.read(key: _keyTenantType);
    if (value == 'STUDENT') return TenantType.student;
    if (value == 'FAMILY') return TenantType.family;
    return null;
  }

  Future<void> setOnboardingCompleted(bool completed) async {
    await _storage.write(key: _keyOnboardingDone, value: completed.toString());
  }

  Future<bool> isOnboardingCompleted() async {
    final value = await _storage.read(key: _keyOnboardingDone);
    return value == 'true';
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
