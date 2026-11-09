import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/notification_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

class NotificationsState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final String? error;

  NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
  });

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  NotificationsState copyWith({
    List<NotificationModel>? notifications,
    bool? isLoading,
    String? error,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final ApiClient _apiClient;
  final bool _isAuthenticated;

  NotificationsNotifier(this._apiClient, this._isAuthenticated)
      : super(NotificationsState()) {
    if (_isAuthenticated) {
      fetchNotifications();
    }
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.get('/notifications');
      final data = res.data['data'] ?? res.data;
      final rawList = data is List ? data : (data['items'] as List? ?? []);

      final list = rawList
          .map((item) => NotificationModel.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, notifications: list);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load notifications.',
      );
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _apiClient.patch('/notifications/$id/read');
      state = state.copyWith(
        notifications: state.notifications
            .map((n) => n.id == id ? NotificationModel(
                  id: n.id,
                  userId: n.userId,
                  type: n.type,
                  title: n.title,
                  body: n.body,
                  data: n.data,
                  isRead: true,
                  createdAt: n.createdAt,
                ) : n)
            .toList(),
      );
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    try {
      await _apiClient.patch('/notifications/read-all');
      state = state.copyWith(
        notifications: state.notifications
            .map((n) => NotificationModel(
                  id: n.id,
                  userId: n.userId,
                  type: n.type,
                  title: n.title,
                  body: n.body,
                  data: n.data,
                  isRead: true,
                  createdAt: n.createdAt,
                ))
            .toList(),
      );
    } catch (_) {}
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final client = ref.watch(apiClientProvider);
  final auth = ref.watch(authProvider);
  return NotificationsNotifier(client, auth.isAuthenticated);
});
