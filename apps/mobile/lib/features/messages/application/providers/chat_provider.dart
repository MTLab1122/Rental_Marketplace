import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../../core/constants/peshawar_constants.dart';
import '../../../../core/models/message_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../auth/application/providers/auth_provider.dart';

class ChatState {
  final List<MessageModel> messages;
  final bool isLoading;
  final bool isSending;
  final bool isOtherTyping;
  final String? error;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isSending = false,
    this.isOtherTyping = false,
    this.error,
  });

  ChatState copyWith({
    List<MessageModel>? messages,
    bool? isLoading,
    bool? isSending,
    bool? isOtherTyping,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      isOtherTyping: isOtherTyping ?? this.isOtherTyping,
      error: error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final String conversationId;
  final ApiClient _apiClient;
  final SecureStorageService _storage;
  final String? _currentUserId;

  io.Socket? _socket;
  Timer? _typingTimer;

  ChatNotifier({
    required this.conversationId,
    required ApiClient apiClient,
    required SecureStorageService storage,
    String? currentUserId,
  })  : _apiClient = apiClient,
        _storage = storage,
        _currentUserId = currentUserId,
        super(ChatState()) {
    initChat();
  }

  Future<void> initChat() async {
    await fetchHistory();
    await _connectSocket();
  }

  Future<void> fetchHistory() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.get('/conversations/$conversationId/messages');
      final data = res.data['data'] ?? res.data;
      final rawList = data is List ? data : (data['items'] as List? ?? []);

      final list = rawList
          .map((item) => MessageModel.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, messages: list);
      await markAsRead();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Could not load messages.');
    }
  }

  Future<void> _connectSocket() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return;

    final wsUri = PeshawarConstants.defaultApiBaseUrl.replaceAll('/api/v1', '');

    try {
      _socket = io.io(
        wsUri,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .enableAutoConnect()
            .build(),
      );

      _socket?.onConnect((_) {
        _socket?.emit('conversation:join', {'conversationId': conversationId});
      });

      _socket?.on('message:new', (data) {
        if (data is Map<String, dynamic>) {
          final newMsg = MessageModel.fromJson(data);
          if (newMsg.conversationId == conversationId) {
            final exists = state.messages.any((m) => m.id == newMsg.id);
            if (!exists) {
              state = state.copyWith(messages: [...state.messages, newMsg]);
              if (newMsg.senderId != _currentUserId) {
                markAsRead();
              }
            }
          }
        }
      });

      _socket?.on('message:read', (data) {
        if (data is Map<String, dynamic> && data['conversationId'] == conversationId) {
          final readAtStr = data['readAt'] as String?;
          final readAt = readAtStr != null ? DateTime.tryParse(readAtStr) : null;
          state = state.copyWith(
            messages: state.messages.map((m) {
              if (m.senderId == _currentUserId) {
                return MessageModel(
                  id: m.id,
                  conversationId: m.conversationId,
                  senderId: m.senderId,
                  content: m.content,
                  isRead: true,
                  readAt: readAt ?? DateTime.now(),
                  createdAt: m.createdAt,
                  senderName: m.senderName,
                );
              }
              return m;
            }).toList(),
          );
        }
      });

      _socket?.on('typing', (data) {
        if (data is Map<String, dynamic> && data['conversationId'] == conversationId) {
          final isTyping = data['isTyping'] as bool? ?? false;
          final sender = data['userId'] as String?;
          if (sender != _currentUserId) {
            state = state.copyWith(isOtherTyping: isTyping);
          }
        }
      });
    } catch (_) {
      // socket connection error
    }
  }

  void onUserTyping() {
    _socket?.emit('typing', {'conversationId': conversationId, 'isTyping': true});
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      _socket?.emit('typing', {'conversationId': conversationId, 'isTyping': false});
    });
  }

  Future<bool> sendMessage(String text) async {
    final content = text.trim();
    if (content.isEmpty || state.isSending) return false;

    state = state.copyWith(isSending: true);
    try {
      final res = await _apiClient.post(
        '/conversations/$conversationId/messages',
        data: {'content': content},
      );
      final data = res.data['data'] ?? res.data;
      final newMsg = MessageModel.fromJson(data as Map<String, dynamic>);

      final exists = state.messages.any((m) => m.id == newMsg.id);
      if (!exists) {
        state = state.copyWith(
          isSending: false,
          messages: [...state.messages, newMsg],
        );
      } else {
        state = state.copyWith(isSending: false);
      }
      return true;
    } catch (e) {
      state = state.copyWith(isSending: false, error: 'Failed to send message.');
      return false;
    }
  }

  Future<void> markAsRead() async {
    try {
      await _apiClient.patch('/conversations/$conversationId/read');
      _socket?.emit('message:read', {'conversationId': conversationId});
    } catch (_) {}
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }
}

final chatProviderFamily =
    StateNotifierProvider.family<ChatNotifier, ChatState, String>(
  (ref, conversationId) {
    final client = ref.watch(apiClientProvider);
    final storage = ref.watch(secureStorageProvider);
    final auth = ref.watch(authProvider);
    return ChatNotifier(
      conversationId: conversationId,
      apiClient: client,
      storage: storage,
      currentUserId: auth.user?.id,
    );
  },
);

