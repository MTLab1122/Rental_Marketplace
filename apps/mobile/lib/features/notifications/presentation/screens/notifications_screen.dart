import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'INQUIRY_RECEIVED':
      case 'INQUIRY_REPLIED':
        return Icons.mail_outline;
      case 'MESSAGE_NEW':
        return Icons.chat_bubble_outline;
      case 'PROPERTY_APPROVED':
        return Icons.check_circle_outline;
      case 'PROPERTY_REJECTED':
        return Icons.warning_amber_outlined;
      default:
        return Icons.notifications_none;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final notifState = ref.watch(notificationsProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notifications')),
        body: EmptyView(
          icon: Icons.notifications_none,
          title: 'Sign In to View Alerts',
          description: 'Receive updates on inquiries, direct messages, and verification.',
          actionText: 'Sign In',
          onAction: () => context.push('/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifState.unreadCount > 0)
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllAsRead(),
              child: const Text('Mark all read', style: TextStyle(color: Colors.white, fontSize: 12)),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(notificationsProvider.notifier).fetchNotifications(),
          ),
        ],
      ),
      body: notifState.isLoading
          ? const LoadingIndicator(message: 'Loading notifications...')
          : notifState.notifications.isEmpty
              ? EmptyView(
                  icon: Icons.notifications_none,
                  title: 'No Notifications',
                  description: 'You are all caught up with your rental updates.',
                  actionText: 'Browse Rentals',
                  onAction: () => context.go('/'),
                )
              : ListView.separated(
                  itemCount: notifState.notifications.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final notif = notifState.notifications[index];
                    final timeStr = DateFormat('MMM d, h:mm a').format(notif.createdAt);
                    final icon = _getTypeIcon(notif.type);

                    return ListTile(
                      tileColor: notif.isRead ? Colors.transparent : AppTheme.primaryEmerald.withOpacity(0.05),
                      leading: CircleAvatar(
                        radius: 20,
                        backgroundColor: notif.isRead
                            ? Colors.grey.shade200
                            : AppTheme.primaryEmerald.withOpacity(0.15),
                        child: Icon(
                          icon,
                          size: 20,
                          color: notif.isRead ? Colors.grey.shade600 : AppTheme.primaryEmerald,
                        ),
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              notif.title,
                              style: TextStyle(
                                fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          if (!notif.isRead)
                            Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(left: 6),
                              decoration: const BoxDecoration(
                                color: AppTheme.primaryEmerald,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 2),
                          Text(
                            notif.body,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            timeStr,
                            style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                          ),
                        ],
                      ),
                      onTap: () {
                        if (!notif.isRead) {
                          ref.read(notificationsProvider.notifier).markAsRead(notif.id);
                        }
                        if (notif.type == 'MESSAGE_NEW') {
                          context.push('/messages');
                        } else if (notif.type.startsWith('INQUIRY')) {
                          context.go('/inquiries');
                        }
                      },
                    );
                  },
                ),
    );
  }
}
