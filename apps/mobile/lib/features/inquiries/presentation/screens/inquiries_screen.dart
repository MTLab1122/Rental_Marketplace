import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/models/conversation_model.dart';
import '../../../../core/models/inquiry_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/inquiries_provider.dart';
import '../../../messages/presentation/screens/chat_screen.dart';

class InquiriesScreen extends ConsumerWidget {
  const InquiriesScreen({super.key});

  Color _getStatusColor(InquiryStatus status) {
    switch (status) {
      case InquiryStatus.submitted:
        return Colors.orange;
      case InquiryStatus.seen:
        return Colors.purple;
      case InquiryStatus.replied:
        return Colors.blue;
      case InquiryStatus.accepted:
        return AppTheme.primaryEmerald;
      case InquiryStatus.declined:
        return Colors.redAccent;
      case InquiryStatus.closed:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final inquiriesState = ref.watch(inquiriesProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Inquiries')),
        body: EmptyView(
          icon: Icons.send_outlined,
          title: 'Sign In to View Inquiries',
          description: 'Track landlord responses and direct booking communications.',
          actionText: 'Sign In',
          onAction: () => context.push('/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Inquiries'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(inquiriesProvider.notifier).fetchMyInquiries(),
          ),
        ],
      ),
      body: inquiriesState.isLoading
          ? const LoadingIndicator(message: 'Loading your inquiries...')
          : inquiriesState.inquiries.isEmpty
              ? EmptyView(
                  icon: Icons.chat_bubble_outline,
                  title: 'No Inquiries Yet',
                  description: 'When you express interest in a property, you can track it here.',
                  actionText: 'Find Rentals',
                  onAction: () => context.go('/'),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: inquiriesState.inquiries.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final inquiry = inquiriesState.inquiries[index];
                    final statusColor = _getStatusColor(inquiry.status);
                    final formattedDate = DateFormat('MMM d, yyyy').format(inquiry.createdAt);

                    return Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    inquiry.propertyTitle ?? 'Property Inquiry',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    inquiry.statusLabel,
                                    style: TextStyle(
                                      color: statusColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (inquiry.propertyLocality != null) ...[
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 13, color: AppTheme.primaryEmerald),
                                  const SizedBox(width: 4),
                                  Text(
                                    inquiry.propertyLocality!,
                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 10),
                            Text(
                              '"${inquiry.message}"',
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade800, fontStyle: FontStyle.italic),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  formattedDate,
                                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                                ),
                                if (inquiry.proposedRentPkr != null)
                                  Text(
                                    'Offered: PKR ${NumberFormat('#,###').format(inquiry.proposedRentPkr)}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryEmerald),
                                  ),
                              ],
                            ),

                            // WhatsApp contact reveal section
                            if (inquiry.canContactWhatsapp && inquiry.whatsappUrl != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.green.shade200),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.verified, color: Colors.green, size: 18),
                                    const SizedBox(width: 8),
                                    const Expanded(
                                      child: Text(
                                        'Inquiry accepted! WhatsApp contact is unlocked.',
                                        style: TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.green.shade600,
                                        foregroundColor: Colors.white,
                                        visualDensity: VisualDensity.compact,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      ),
                                      icon: const Icon(Icons.chat, size: 14),
                                      label: const Text('WhatsApp', style: TextStyle(fontSize: 11)),
                                      onPressed: () async {
                                        final uri = Uri.parse(inquiry.whatsappUrl!);
                                        if (await canLaunchUrl(uri)) {
                                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                                        }
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            // In-App Chat button
                            if (inquiry.conversationId != null) ...[
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  icon: const Icon(Icons.chat_bubble_outline, size: 15, color: AppTheme.primaryEmerald),
                                  label: const Text(
                                    'Open In-App Chat',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryEmerald),
                                  ),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => ChatScreen(
                                          conversation: ConversationModel(
                                            id: inquiry.conversationId!,
                                            inquiryId: inquiry.id,
                                            propertyId: inquiry.propertyId,
                                            propertyTitle: inquiry.propertyTitle,
                                            propertyLocality: inquiry.propertyLocality,
                                            canContactWhatsapp: inquiry.canContactWhatsapp,
                                            whatsappUrl: inquiry.whatsappUrl,
                                            participants: [],
                                            createdAt: inquiry.createdAt,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
