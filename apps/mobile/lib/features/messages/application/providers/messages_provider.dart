import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/conversation_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/application/providers/auth_provider.dart';

class MessagesState {
  final List<ConversationModel> conversations;
  final bool isLoading;
  final String? error;

  MessagesState({
    this.conversations = const [],
    this.isLoading = false,
    this.error,
  });

  MessagesState copyWith({
    List<ConversationModel>? conversations,
    bool? isLoading,
    String? error,
  }) {
    return MessagesState(
      conversations: conversations ?? this.conversations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class MessagesNotifier extends StateNotifier<MessagesState> {
  final ApiClient _apiClient;
  final bool _isAuthenticated;

  MessagesNotifier(this._apiClient, this._isAuthenticated)
      : super(MessagesState()) {
    if (_isAuthenticated) {
      fetchConversations();
    }
  }

  Future<void> fetchConversations() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.get('/conversations');
      final data = res.data['data'] ?? res.data;
      final rawList = data is List ? data : (data['items'] as List? ?? []);

      final list = rawList
          .map((item) => ConversationModel.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, conversations: list);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load conversations. Tap to refresh.',
      );
    }
  }

  Future<bool> blockConversation(String conversationId) async {
    try {
      await _apiClient.post('/conversations/$conversationId/block', data: {
        'reason': 'Blocked by user',
      });
      await fetchConversations();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> reportConversation({
    required String conversationId,
    required String reason,
    required String details,
  }) async {
    try {
      await _apiClient.post('/conversations/$conversationId/report', data: {
        'reason': reason,
        'details': details,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}

final messagesProvider =
    StateNotifierProvider<MessagesNotifier, MessagesState>((ref) {
  final client = ref.watch(apiClientProvider);
  final auth = ref.watch(authProvider);
  return MessagesNotifier(client, auth.isAuthenticated);
});
