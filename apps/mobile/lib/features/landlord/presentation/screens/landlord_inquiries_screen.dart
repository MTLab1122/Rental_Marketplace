import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/providers/landlord_provider.dart';

class LandlordInquiriesScreen extends ConsumerStatefulWidget {
  const LandlordInquiriesScreen({super.key});

  @override
  ConsumerState<LandlordInquiriesScreen> createState() =>
      _LandlordInquiriesScreenState();
}

class _LandlordInquiriesScreenState
    extends ConsumerState<LandlordInquiriesScreen> {
  String _selectedFilter = '';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(landlordInquiriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inquiry Inbox'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref
                .read(landlordInquiriesProvider.notifier)
                .loadInquiries(status: _selectedFilter),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _buildFilterChip('All Inquiries', ''),
                _buildFilterChip('Pending', 'PENDING'),
                _buildFilterChip('Accepted', 'ACCEPTED'),
                _buildFilterChip('Declined', 'DECLINED'),
              ],
            ),
          ),

          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
                : state.error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(state.error!, style: const TextStyle(color: Colors.red)),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => ref
                                  .read(landlordInquiriesProvider.notifier)
                                  .loadInquiries(status: _selectedFilter),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : state.inquiries.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 12),
                                Text(
                                  'No inquiries in this folder.',
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: state.inquiries.length,
                            itemBuilder: (context, index) {
                              final inq = state.inquiries[index] as Map<String, dynamic>;
                              return _buildInquiryCard(context, inq);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: AppTheme.primaryEmerald,
        backgroundColor: Colors.white,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
        onSelected: (val) {
          setState(() => _selectedFilter = value);
          ref.read(landlordInquiriesProvider.notifier).loadInquiries(status: value);
        },
      ),
    );
  }

  Widget _buildInquiryCard(BuildContext context, Map<String, dynamic> inq) {
    final id = inq['id'] as String? ?? '';
    final status = inq['status'] as String? ?? 'PENDING';
    final tenant = inq['tenant'] as Map<String, dynamic>? ?? {};
    final tenantName = tenant['fullName'] as String? ?? 'Prospective Tenant';
    final tenantPhone = tenant['phoneNumber'] as String?;
    final prop = inq['property'] as Map<String, dynamic>? ?? {};
    final propTitle = prop['title'] as String? ?? 'Rental Property';
    final message = inq['message'] as String? ?? '';
    final proposedRent = (inq['proposedRentPkr'] as num?)?.toInt();
    final moveInDate = inq['proposedMoveInDate'] as String?;
    final formatter = NumberFormat('#,###', 'en_PK');

    final isAccepted = status == 'ACCEPTED';
    final isPending = status == 'PENDING';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    tenantName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                _buildStatusChip(status),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              propTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
            ),
            const Divider(height: 18),

            if (proposedRent != null || moveInDate != null) ...[
              Row(
                children: [
                  if (proposedRent != null)
                    Expanded(
                      child: Text(
                        'Offer: PKR ${formatter.format(proposedRent)}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.primaryEmeraldDark),
                      ),
                    ),
                  if (moveInDate != null)
                    Expanded(
                      child: Text(
                        'Move-in: $moveInDate',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
            ],

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                message.isNotEmpty ? message : 'No message provided.',
                style: const TextStyle(fontSize: 13),
              ),
            ),
            const SizedBox(height: 12),

            // Actions & Contact revealing
            if (isPending)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _showDeclineDialog(context, id),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                      ),
                      child: const Text('Decline'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        final ok = await ref
                            .read(landlordInquiriesProvider.notifier)
                            .updateStatus(id, 'ACCEPTED');
                        if (ok && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Inquiry Accepted! Contact details revealed.'),
                              backgroundColor: AppTheme.primaryEmeraldDark,
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryEmerald,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Accept Inquiry'),
                    ),
                  ),
                ],
              )
            else if (isAccepted)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/messages'),
                      icon: const Icon(Icons.chat_bubble_outline, size: 16),
                      label: const Text('Chat'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryEmerald,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  if (tenantPhone != null && tenantPhone.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _launchWhatsApp(tenantPhone),
                        icon: const Icon(Icons.phone, size: 16, color: Colors.green),
                        label: const Text('WhatsApp'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.green.shade800,
                          side: BorderSide(color: Colors.green.shade300),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg = Colors.amber.shade50;
    Color fg = Colors.amber.shade800;

    if (status == 'ACCEPTED') {
      bg = Colors.green.shade50;
      fg = Colors.green.shade800;
    } else if (status == 'DECLINED') {
      bg = Colors.red.shade50;
      fg = Colors.red.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: fg)),
    );
  }

  void _showDeclineDialog(BuildContext context, String inquiryId) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Decline Inquiry'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Please provide a reason to inform the prospective tenant:'),
            const SizedBox(height: 10),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(
                hintText: 'e.g. Unit has already been reserved',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(landlordInquiriesProvider.notifier).updateStatus(
                    inquiryId,
                    'DECLINED',
                    declineReason: reasonCtrl.text.trim(),
                  );
            },
            child: const Text('Confirm Decline'),
          ),
        ],
      ),
    );
  }

  Future<void> _launchWhatsApp(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final uri = Uri.parse('https://wa.me/$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
