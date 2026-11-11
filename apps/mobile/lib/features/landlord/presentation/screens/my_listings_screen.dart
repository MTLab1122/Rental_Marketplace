import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/providers/landlord_provider.dart';

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen> {
  String _selectedFilter = 'ALL';

  final List<String> _filters = [
    'ALL',
    'AVAILABLE',
    'PENDING_REVIEW',
    'RENTED',
    'UNAVAILABLE',
    'REJECTED',
  ];

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(landlordPropertiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Listings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref
                .read(landlordPropertiesProvider.notifier)
                .loadProperties(statusFilter: _selectedFilter),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/landlord/properties/new'),
        backgroundColor: AppTheme.primaryEmerald,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Post Listing'),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(
                      filter.replaceAll('_', ' '),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.white : AppTheme.textDark,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppTheme.primaryEmerald,
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: isSelected ? AppTheme.primaryEmerald : Colors.grey.shade300,
                    ),
                    onSelected: (selected) {
                      setState(() {
                        _selectedFilter = filter;
                      });
                      ref
                          .read(landlordPropertiesProvider.notifier)
                          .loadProperties(statusFilter: filter);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Listing Content
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
                                  .read(landlordPropertiesProvider.notifier)
                                  .loadProperties(statusFilter: _selectedFilter),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : state.properties.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.maps_home_work_outlined, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 12),
                                Text(
                                  'No listings found in $_selectedFilter.',
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton(
                                  onPressed: () => context.push('/landlord/properties/new'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryEmerald,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Add Your First Property'),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 80),
                            itemCount: state.properties.length,
                            itemBuilder: (context, index) {
                              final item = state.properties[index] as Map<String, dynamic>;
                              return _buildListingCard(context, item);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildListingCard(BuildContext context, Map<String, dynamic> item) {
    final id = item['id'] as String? ?? '';
    final title = item['title'] as String? ?? 'Untitled Property';
    final rent = (item['monthlyRentPkr'] as num?)?.toInt() ?? 0;
    final status = item['status'] as String? ?? 'AVAILABLE';
    final moderationStatus = item['moderationStatus'] as String? ?? 'PENDING_REVIEW';
    final locality = item['locality']?['name'] as String? ?? item['localityName'] as String? ?? 'Peshawar';
    final eligibility = item['eligibility'] as String? ?? 'STUDENTS_ONLY';
    final images = item['images'] as List<dynamic>? ?? [];
    final firstImage = images.isNotEmpty ? images[0]['url'] as String? : null;
    final formatter = NumberFormat('#,###', 'en_PK');

    final isRejected = moderationStatus == 'REJECTED';
    final isSuspended = moderationStatus == 'SUSPENDED';

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isRejected ? Colors.red.shade200 : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header thumbnail and main info
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 80,
                    height: 80,
                    color: Colors.grey.shade100,
                    child: firstImage != null
                        ? Image.network(
                            firstImage,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.home, color: Colors.grey),
                          )
                        : const Icon(Icons.home, color: Colors.grey),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'PKR ${formatter.format(rent)}/mo • $locality',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.primaryEmeraldDark),
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          _buildBadge(
                            eligibility == 'STUDENTS_ONLY' ? 'Students' : 'Families',
                            eligibility == 'STUDENTS_ONLY' ? AppTheme.studentsOnlyBg : AppTheme.familiesOnlyBg,
                            eligibility == 'STUDENTS_ONLY' ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                          ),
                          _buildModerationBadge(moderationStatus),
                          _buildStatusBadge(status),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (isRejected && item['rejectionReason'] != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: Colors.red.shade50,
              child: Text(
                'Rejection Reason: ${item['rejectionReason']}',
                style: TextStyle(fontSize: 12, color: Colors.red.shade800, fontWeight: FontWeight.w500),
              ),
            ),

          const Divider(height: 1),

          // Actions Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                // Change status menu button
                PopupMenuButton<String>(
                  tooltip: 'Change Status',
                  onSelected: (val) async {
                    if (isRejected || isSuspended) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Cannot activate rejected or suspended listings. Please update and re-submit for review.'),
                          backgroundColor: Colors.red,
                        ),
                      );
                      return;
                    }
                    final ok = await ref
                        .read(landlordPropertiesProvider.notifier)
                        .updateStatus(id, val);
                    if (!ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Failed to update status'), backgroundColor: Colors.red),
                      );
                    }
                  },
                  itemBuilder: (ctx) => [
                    const PopupMenuItem(value: 'AVAILABLE', child: Text('Mark Available')),
                    const PopupMenuItem(value: 'RENTED', child: Text('Mark Rented')),
                    const PopupMenuItem(value: 'UNAVAILABLE', child: Text('Mark Unavailable')),
                  ],
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Status: $status', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        const Icon(Icons.arrow_drop_down, size: 18),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                // Analytics
                IconButton(
                  tooltip: 'View Analytics',
                  icon: const Icon(Icons.bar_chart, color: Colors.blue),
                  onPressed: () => context.push('/landlord/properties/$id/analytics'),
                ),
                // Edit
                IconButton(
                  tooltip: 'Edit Listing',
                  icon: const Icon(Icons.edit_outlined, color: Colors.grey),
                  onPressed: () => context.push('/landlord/properties/$id/edit'),
                ),
                // Delete
                IconButton(
                  tooltip: 'Delete Listing',
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _confirmDelete(context, id, title),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color bg, Color textCol) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
      child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textCol)),
    );
  }

  Widget _buildModerationBadge(String modStatus) {
    Color bg = Colors.amber.shade50;
    Color fg = Colors.amber.shade800;
    String text = 'Pending Review';

    if (modStatus == 'APPROVED') {
      bg = Colors.green.shade50;
      fg = Colors.green.shade800;
      text = 'Approved';
    } else if (modStatus == 'REJECTED') {
      bg = Colors.red.shade50;
      fg = Colors.red.shade800;
      text = 'Rejected';
    } else if (modStatus == 'SUSPENDED') {
      bg = Colors.purple.shade50;
      fg = Colors.purple.shade800;
      text = 'Suspended';
    }

    return _buildBadge(text, bg, fg);
  }

  Widget _buildStatusBadge(String status) {
    Color bg = Colors.grey.shade100;
    Color fg = Colors.grey.shade700;

    if (status == 'AVAILABLE') {
      bg = const Color(0xFFECFDF5);
      fg = const Color(0xFF047857);
    } else if (status == 'RENTED') {
      bg = Colors.blue.shade50;
      fg = Colors.blue.shade700;
    }

    return _buildBadge(status, bg, fg);
  }

  void _confirmDelete(BuildContext context, String id, String title) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Listing?'),
        content: Text('Are you sure you want to remove "$title"? This listing will be taken off the marketplace.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final ok = await ref.read(landlordPropertiesProvider.notifier).deleteProperty(id);
              if (!ok && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Failed to delete property'), backgroundColor: Colors.red),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
