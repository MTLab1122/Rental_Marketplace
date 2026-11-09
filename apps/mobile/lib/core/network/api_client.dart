import 'package:dio/dio.dart';
import '../constants/peshawar_constants.dart';
import '../storage/secure_storage_service.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorageService _storage;
  final String baseUrl;

  ApiClient({
    SecureStorageService? storage,
    String? customBaseUrl,
    Dio? customDio,
  })  : _storage = storage ?? SecureStorageService(),
        baseUrl = customBaseUrl ?? PeshawarConstants.defaultApiBaseUrl {
    _dio = customDio ??
        Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Attempt refresh if refresh token exists
            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken != null && error.requestOptions.path != '/auth/refresh') {
              try {
                final refreshResponse = await _dio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                if (refreshResponse.statusCode == 200 || refreshResponse.statusCode == 201) {
                  final data = refreshResponse.data['data'] ?? refreshResponse.data;
                  final newAccessToken = data['tokens']['accessToken'] as String;
                  final newRefreshToken = data['tokens']['refreshToken'] as String;

                  await _storage.saveTokens(
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                  );

                  // Retry the original request
                  final originalRequest = error.requestOptions;
                  originalRequest.headers['Authorization'] = 'Bearer $newAccessToken';
                  final retryResponse = await _dio.fetch(originalRequest);
                  return handler.resolve(retryResponse);
                }
              } catch (_) {
                await _storage.clearTokens();
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get(path, queryParameters: queryParameters, options: options);
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.patch(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete(path, data: data, queryParameters: queryParameters, options: options);
  }
}

