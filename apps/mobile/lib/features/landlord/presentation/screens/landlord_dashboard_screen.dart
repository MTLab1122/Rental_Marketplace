import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/providers/landlord_provider.dart';

class LandlordDashboardScreen extends ConsumerWidget {
  const LandlordDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(landlordDashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Landlord Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(landlordDashboardProvider.notifier).loadDashboard(),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
          : state.error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(state.error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () =>
                            ref.read(landlordDashboardProvider.notifier).loadDashboard(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(landlordDashboardProvider.notifier).loadDashboard(),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildVerificationBanner(context, state.data),
                      const SizedBox(height: 16),
                      _buildMetricCards(context, state.data),
                      const SizedBox(height: 20),
                      _buildActionButtons(context),
                      const SizedBox(height: 24),
                      _buildRecentInquiries(context, state.data),
                    ],
                  ),
                ),
    );
  }

  Widget _buildVerificationBanner(BuildContext context, LandlordDashboardData? data) {
    final isVerified = data?.isIdentityVerified ?? false;
    final status = data?.verificationStatus ?? 'UNVERIFIED';

    if (isVerified) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.primaryEmerald.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.3)),
        ),
        child: const Row(
          children: [
            Icon(Icons.verified_user, color: AppTheme.primaryEmerald, size: 28),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Identity Verified (CNIC)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryEmeraldDark),
                  ),
                  Text(
                    'Your account is cleared to publish rental listings in Peshawar.',
                    style: TextStyle(fontSize: 12, color: Colors.black87),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800, size: 30),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  status == 'PENDING'
                      ? 'Verification Under Review'
                      : 'CNIC Verification Required',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.amber.shade900,
                  ),
                ),
                Text(
                  status == 'PENDING'
                      ? 'Our moderation team is verifying your CNIC and selfie.'
                      : 'You must verify your CNIC before listing rental properties.',
                  style: const TextStyle(fontSize: 12, color: Colors.black87),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => context.push('/landlord/verification'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber.shade800,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            child: Text(status == 'PENDING' ? 'Status' : 'Verify'),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCards(BuildContext context, LandlordDashboardData? data) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                'Active Listings',
                '${data?.activeProperties ?? 0}',
                '${data?.totalProperties ?? 0} total',
                Icons.home_work_outlined,
                AppTheme.primaryEmerald,
                () => context.push('/landlord/properties'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricTile(
                'Total Inquiries',
                '${data?.totalInquiries ?? 0}',
                '${data?.pendingInquiries ?? 0} pending',
                Icons.mark_chat_unread_outlined,
                Colors.blue.shade600,
                () => context.push('/landlord/inquiries'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                'Listing Views',
                '${data?.totalViews ?? 0}',
                'Real tenant visits',
                Icons.visibility_outlined,
                Colors.purple.shade600,
                null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricTile(
                'Avg Response',
                data?.averageResponseMinutes != null
                    ? '${data!.averageResponseMinutes} min'
                    : 'N/A',
                'Response speed',
                Icons.speed,
                AppTheme.accentTerracotta,
                null,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricTile(
    String label,
    String value,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback? onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
                Icon(icon, color: color, size: 20),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => context.push('/landlord/properties/new'),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Post Property'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryEmerald,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => context.push('/landlord/properties'),
            icon: const Icon(Icons.list_alt, size: 18),
            label: const Text('My Listings'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.textDark,
              side: BorderSide(color: Colors.grey.shade300),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentInquiries(BuildContext context, LandlordDashboardData? data) {
    final list = data?.recentInquiries ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Recent Inquiries', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            TextButton(
              onPressed: () => context.push('/landlord/inquiries'),
              child: const Text('View All', style: TextStyle(color: AppTheme.primaryEmerald)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (list.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Center(
              child: Text(
                'No inquiries received yet.',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ),
          )
        else
          ...list.take(4).map((inq) {
            final tenantName = inq['tenant']?['fullName'] ?? 'Prospective Tenant';
            final propTitle = inq['property']?['title'] ?? 'Listing';
            final status = inq['status'] as String? ?? 'PENDING';
            final message = inq['message'] as String? ?? '';

            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: ListTile(
                onTap: () => context.push('/landlord/inquiries'),
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primaryEmerald.withOpacity(0.1),
                  child: const Icon(Icons.person, color: AppTheme.primaryEmerald),
                ),
                title: Text(tenantName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(propTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                    if (message.isNotEmpty)
                      Text(
                        message,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      ),
                  ],
                ),
                trailing: Chip(
                  label: Text(
                    status,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: status == 'ACCEPTED'
                          ? Colors.green.shade800
                          : status == 'PENDING'
                              ? Colors.amber.shade800
                              : Colors.red.shade800,
                    ),
                  ),
                  backgroundColor: status == 'ACCEPTED'
                      ? Colors.green.shade50
                      : status == 'PENDING'
                          ? Colors.amber.shade50
                          : Colors.red.shade50,
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            );
          }),
      ],
    );
  }
}

