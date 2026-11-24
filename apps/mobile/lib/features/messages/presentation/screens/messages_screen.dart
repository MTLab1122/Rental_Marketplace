import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/messages_provider.dart';
import 'chat_screen.dart';

class MessagesScreen extends ConsumerWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final messagesState = ref.watch(messagesProvider);
    final currentUserId = authState.user?.id ?? '';

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Direct Messages')),
        body: EmptyView(
          icon: Icons.chat_outlined,
          title: 'Sign In to Message Landlords',
          description:
              'Communicate directly with verified landlords across Peshawar.',
          actionText: 'Sign In',
          onAction: () => context.push('/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Direct Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(messagesProvider.notifier).fetchConversations(),
          ),
        ],
      ),
      body: messagesState.isLoading
          ? const LoadingIndicator(message: 'Loading conversations...')
          : messagesState.conversations.isEmpty
              ? EmptyView(
                  icon: Icons.chat_bubble_outline,
                  title: 'No Conversations Yet',
                  description:
                      'Send an inquiry on any rental listing to start messaging the landlord.',
                  actionText: 'Browse Rentals',
                  onAction: () => context.go('/'),
                )
              : ListView.separated(
                  itemCount: messagesState.conversations.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final conv = messagesState.conversations[index];
                    final otherName =
                        conv.getOtherParticipantName(currentUserId);
                    final timeStr = conv.lastMessageAt != null
                        ? DateFormat('MMM d, h:mm a')
                            .format(conv.lastMessageAt!)
                        : '';

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor:
                            AppTheme.primaryEmerald.withValues(alpha: 0.15),
                        child: Text(
                          otherName.isNotEmpty
                              ? otherName[0].toUpperCase()
                              : 'M',
                          style: const TextStyle(
                            color: AppTheme.primaryEmerald,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              otherName,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (timeStr.isNotEmpty)
                            Text(
                              timeStr,
                              style: TextStyle(
                                  fontSize: 11, color: Colors.grey.shade500),
                            ),
                        ],
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (conv.propertyTitle != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              conv.propertyTitle!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.primaryEmerald,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  conv.isBlocked
                                      ? '[Blocked by user]'
                                      : (conv.lastMessage?.content ??
                                          'Started conversation'),
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: conv.isBlocked
                                        ? Colors.red
                                        : Colors.grey.shade700,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (conv.unreadCount > 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryEmerald,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '${conv.unreadCount}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                ChatScreen(conversation: conv),
                          ),
                        );
                      },
                    );
                  },
                ),
    );
  }
}
