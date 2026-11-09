import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';

class MessagesScreen extends ConsumerWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Direct Messages')),
        body: EmptyView(
          icon: Icons.chat_outlined,
          title: 'Sign In to Message Landlords',
          description: 'Communicate directly with verified landlords across Peshawar.',
          actionText: 'Sign In',
          onAction: () => context.push('/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Direct Messages')),
      body: const EmptyView(
        icon: Icons.chat_outlined,
        title: 'No Conversations Yet',
        description: 'Send an inquiry on any rental listing to start messaging the landlord.',
      ),
    );
  }
}
