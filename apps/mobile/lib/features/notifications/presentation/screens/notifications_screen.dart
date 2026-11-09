import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notifications')),
        body: EmptyView(
          icon: Icons.notifications_none,
          title: 'Sign In to View Notifications',
          description: 'Stay updated when landlords accept or respond to your inquiries.',
          actionText: 'Sign In',
          onAction: () => context.push('/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: const EmptyView(
        icon: Icons.notifications_none,
        title: 'You are all caught up!',
        description: 'No new notifications right now.',
      ),
    );
  }
}
