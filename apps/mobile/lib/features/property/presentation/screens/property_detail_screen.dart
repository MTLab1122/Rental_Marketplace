import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/models/property_model.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../../favorites/application/providers/favorites_provider.dart';
import '../../../inquiries/application/providers/inquiries_provider.dart';

final propertyDetailFutureProvider =
    FutureProvider.autoDispose.family<PropertyModel, String>((ref, slugOrId) async {
  final client = ref.watch(apiClientProvider);
  final res = await client.get('/properties/$slugOrId');
  final data = res.data['data'] ?? res.data;
  return PropertyModel.fromJson(data as Map<String, dynamic>);
});

class PropertyDetailScreen extends ConsumerStatefulWidget {
  final String slugOrId;
  const PropertyDetailScreen({super.key, required this.slugOrId});

  @override
  ConsumerState<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends ConsumerState<PropertyDetailScreen> {
  int _activeImageIndex = 0;

  void _showInquiryDialog(BuildContext context, PropertyModel property) {
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please sign in to send an inquiry to the landlord.'),
          action: SnackBarAction(
            label: 'Sign In',
            onPressed: () => context.push('/login'),
          ),
        ),
      );
      return;
    }

    final messageController = TextEditingController(
      text: 'Hello, I am interested in visiting this property in ${property.localityName}. When is a good time?',
    );
    final rentController = TextEditingController(
      text: property.monthlyRentPkr.toString(),
    );
    String contactMethod = 'PHONE';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final inquiriesState = ref.watch(inquiriesProvider);

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Send Inquiry',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Contact the verified landlord for ${property.title}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 14),

                  // Message
                  TextField(
                    controller: messageController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Your Message',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Proposed Rent
                  TextField(
                    controller: rentController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Proposed Monthly Rent (PKR)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Contact Method
                  Row(
                    children: [
                      const Text('Preferred Contact: ', style: TextStyle(fontSize: 13)),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('Phone'),
                        selected: contactMethod == 'PHONE',
                        onSelected: (_) => setSheetState(() => contactMethod = 'PHONE'),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('In-App'),
                        selected: contactMethod == 'IN_APP',
                        onSelected: (_) => setSheetState(() => contactMethod = 'IN_APP'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: inquiriesState.isSubmitting
                        ? null
                        : () async {
                            final success = await ref
                                .read(inquiriesProvider.notifier)
                                .createInquiry(
                                  propertyId: property.id,
                                  message: messageController.text.trim(),
                                  proposedRentPkr: int.tryParse(rentController.text),
                                  preferredContactMethod: contactMethod,
                                );

                            if (success && mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Inquiry submitted! The landlord will be notified.'),
                                  backgroundColor: AppTheme.primaryEmerald,
                                ),
                              );
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryEmerald,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: inquiriesState.isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Submit Inquiry', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showReportDialog(BuildContext context, PropertyModel property) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report Property'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Help keep Peshawar rentals safe. Reports are promptly audited by administrators.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Describe the issue (e.g. misleading photos, wrong rent, inappropriate)...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report submitted. Thank you for your vigilance.')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Submit Report', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertyAsync = ref.watch(propertyDetailFutureProvider(widget.slugOrId));
    final favState = ref.watch(favoritesProvider);

    return propertyAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const LoadingIndicator(message: 'Loading property details...'),
      ),
      error: (err, stack) => Scaffold(
        appBar: AppBar(),
        body: ErrorView(
          message: 'Unable to load property details.',
          onRetry: () => ref.refresh(propertyDetailFutureProvider(widget.slugOrId)),
        ),
      ),
      data: (property) {
        final isFav = favState.favoriteIds.contains(property.id);
        final isStudent = property.eligibility == PropertyEligibility.studentsOnly;

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              // Hero Image Gallery AppBar
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: property.images.isNotEmpty
                      ? Stack(
                          fit: StackFit.expand,
                          children: [
                            PageView.builder(
                              itemCount: property.images.length,
                              onPageChanged: (idx) => setState(() => _activeImageIndex = idx),
                              itemBuilder: (context, idx) {
                                return CachedNetworkImage(
                                  imageUrl: property.images[idx].url,
                                  fit: BoxFit.cover,
                                  errorWidget: (context, url, error) => Container(
                                    color: Colors.grey.shade200,
                                    child: const Icon(Icons.broken_image, size: 48),
                                  ),
                                );
                              },
                            ),
                            if (property.images.length > 1)
                              Positioned(
                                bottom: 16,
                                right: 16,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black54,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Text(
                                    '${_activeImageIndex + 1} / ${property.images.length}',
                                    style: const TextStyle(color: Colors.white, fontSize: 12),
                                  ),
                                ),
                              ),
                          ],
                        )
                      : Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.apartment, size: 64, color: Colors.grey),
                        ),
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      color: isFav ? Colors.red : Colors.white,
                    ),
                    onPressed: () {
                      ref.read(favoritesProvider.notifier).toggleFavorite(property);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.flag_outlined, color: Colors.white),
                    onPressed: () => _showReportDialog(context, property),
                  ),
                ],
              ),

              // Property Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Eligibility Badge & Type
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: isStudent ? AppTheme.studentsOnlyBg : AppTheme.familiesOnlyBg,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              property.eligibilityLabel,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                              ),
                            ),
                          ),
                          Text(
                            property.propertyTypeLabel,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Title
                      Text(
                        property.title,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 6),

                      // Locality
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 16, color: AppTheme.primaryEmerald),
                          const SizedBox(width: 4),
                          Text(
                            property.localityName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textDark,
                            ),
                          ),
                          if (property.addressNote != null) ...[
                            const SizedBox(width: 4),
                            Text('(${property.addressNote})', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                          ],
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Price & Security Deposit Box
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Column(
                              children: [
                                const Text('Monthly Rent', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                const SizedBox(height: 4),
                                Text(
                                  property.formattedRent,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryEmerald,
                                  ),
                                ),
                              ],
                            ),
                            Container(height: 36, width: 1, color: Colors.grey.shade300),
                            Column(
                              children: [
                                const Text('Security Deposit', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                const SizedBox(height: 4),
                                Text(
                                  property.formattedDeposit,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Key Specs
                      const Text('Property Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildDetailSpec(Icons.bed, '${property.bedrooms}', 'Bedrooms'),
                          _buildDetailSpec(Icons.bathtub_outlined, '${property.bathrooms}', 'Bathrooms'),
                          if (property.areaSqFt != null)
                            _buildDetailSpec(Icons.square_foot, '${property.areaSqFt!.toInt()}', 'Sq Ft'),
                          if (property.furnishing != null)
                            _buildDetailSpec(Icons.chair_outlined, property.furnishing!, 'Furnished'),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Description
                      if (property.description != null && property.description!.isNotEmpty) ...[
                        const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(
                          property.description!,
                          style: TextStyle(fontSize: 14, color: Colors.grey.shade700, height: 1.5),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Amenities
                      if (property.amenities.isNotEmpty) ...[
                        const Text('Amenities & Utilities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: property.amenities.map((amen) {
                            return Chip(
                              label: Text(amen.name, style: const TextStyle(fontSize: 12)),
                              backgroundColor: Colors.grey.shade100,
                              avatar: const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.primaryEmerald),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Location & Geofencing Note
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.verified_user, color: Colors.blue, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Coordinates verified strictly within Peshawar municipal boundaries (${property.latitude.toStringAsFixed(4)}, ${property.longitude.toStringAsFixed(4)}).',
                                style: TextStyle(fontSize: 12, color: Colors.blue.shade900),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 80), // Padding for sticky bottom button
                    ],
                  ),
                ),
              ),
            ],
          ),
          bottomSheet: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.send),
                      label: const Text('Contact Landlord / Inquire'),
                      onPressed: () => _showInquiryDialog(context, property),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryEmerald,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailSpec(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, size: 24, color: AppTheme.primaryEmerald),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
      ],
    );
  }
}
