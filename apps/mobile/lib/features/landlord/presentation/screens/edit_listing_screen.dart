import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/landlord_provider.dart';

class EditListingScreen extends ConsumerStatefulWidget {
  final String propertyId;

  const EditListingScreen({super.key, required this.propertyId});

  @override
  ConsumerState<EditListingScreen> createState() => _EditListingScreenState();
}

class _EditListingScreenState extends ConsumerState<EditListingScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  String _title = '';
  String _description = '';
  int _monthlyRentPkr = 0;
  int _securityDepositPkr = 0;
  String _furnishing = 'UNFURNISHED';
  String _status = 'AVAILABLE';
  String _moderationStatus = 'APPROVED';
  String? _rejectionReason;
  List<Map<String, dynamic>> _images = [];

  final TextEditingController _newImageUrlCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchProperty();
  }

  @override
  void dispose() {
    _newImageUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchProperty() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final client = ref.read(apiClientProvider);
      final res = await client.get('/landlord/properties/${widget.propertyId}');
      final data = res.data['data'] ?? res.data;

      setState(() {
        _title = data['title'] as String? ?? '';
        _description = data['description'] as String? ?? '';
        _monthlyRentPkr = (data['monthlyRentPkr'] as num?)?.toInt() ?? 0;
        _securityDepositPkr = (data['securityDepositPkr'] as num?)?.toInt() ?? 0;
        _furnishing = data['furnishing'] as String? ?? 'UNFURNISHED';
        _status = data['status'] as String? ?? 'AVAILABLE';
        _moderationStatus = data['moderationStatus'] as String? ?? 'APPROVED';
        _rejectionReason = data['rejectionReason'] as String?;

        final rawImgs = data['images'] as List<dynamic>? ?? [];
        _images = rawImgs.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load property details';
      });
    }
  }

  Future<void> _saveChanges() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final client = ref.read(apiClientProvider);

      // Check if trying to activate rejected property
      final isRejectedOrSuspended =
          _moderationStatus == 'REJECTED' || _moderationStatus == 'SUSPENDED';

      if (isRejectedOrSuspended && _status == 'AVAILABLE') {
        setState(() {
          _isSaving = false;
          _errorMessage =
              'Cannot activate a rejected or suspended property. Keep as UNAVAILABLE or contact moderation.';
        });
        return;
      }

      await client.patch(
        '/landlord/properties/${widget.propertyId}',
        data: {
          'title': _title,
          'description': _description,
          'monthlyRentPkr': _monthlyRentPkr,
          'securityDepositPkr': _securityDepositPkr,
          'furnishing': _furnishing,
        },
      );

      // Update status if needed
      await client.patch(
        '/landlord/properties/${widget.propertyId}/status',
        data: {'status': _status},
      );

      // Update images
      await client.patch(
        '/landlord/properties/${widget.propertyId}/images',
        data: {
          'images': _images.asMap().entries.map((entry) {
            return {
              'url': entry.value['url'],
              'isPrimary': entry.value['isPrimary'] == true,
              'sortOrder': entry.key,
            };
          }).toList(),
        },
      );

      ref.read(landlordPropertiesProvider.notifier).loadProperties();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Property updated successfully'),
            backgroundColor: AppTheme.primaryEmeraldDark,
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to save changes. Please try again.';
      });
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Listing'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
          : _errorMessage != null && _title.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _fetchProperty, child: const Text('Retry')),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_errorMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                      ),

                    if (_moderationStatus == 'REJECTED')
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade300),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Moderation Status: REJECTED', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                            const SizedBox(height: 4),
                            Text('Reason: ${_rejectionReason ?? 'Please review platform guidelines and update details.'}', style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                      ),

                    const Text('Title', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextFormField(
                      initialValue: _title,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      onChanged: (v) => _title = v,
                    ),
                    const SizedBox(height: 16),

                    const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextFormField(
                      initialValue: _description,
                      maxLines: 4,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      onChanged: (v) => _description = v,
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Monthly Rent (PKR)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              const SizedBox(height: 6),
                              TextFormField(
                                initialValue: _monthlyRentPkr.toString(),
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                onChanged: (v) => _monthlyRentPkr = int.tryParse(v) ?? _monthlyRentPkr,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Deposit (PKR)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              const SizedBox(height: 6),
                              TextFormField(
                                initialValue: _securityDepositPkr.toString(),
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                onChanged: (v) => _securityDepositPkr = int.tryParse(v) ?? _securityDepositPkr,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    const Text('Availability Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _status,
                      items: const [
                        DropdownMenuItem(value: 'AVAILABLE', child: Text('AVAILABLE (Visible in Search)')),
                        DropdownMenuItem(value: 'RENTED', child: Text('RENTED (Hidden from Search)')),
                        DropdownMenuItem(value: 'UNAVAILABLE', child: Text('UNAVAILABLE (Hidden from Search)')),
                      ],
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      onChanged: (v) {
                        if (v != null) setState(() => _status = v);
                      },
                    ),
                    const SizedBox(height: 20),

                    // Media Manager Section
                    const Text('Manage Photos (Up to 12)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _newImageUrlCtrl,
                            decoration: const InputDecoration(
                              hintText: 'New image URL',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            final url = _newImageUrlCtrl.text.trim();
                            if (url.isNotEmpty && _images.length < 12) {
                              setState(() {
                                _images.add({'url': url, 'isPrimary': _images.isEmpty});
                                _newImageUrlCtrl.clear();
                              });
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryEmerald,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Add'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ..._images.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final img = entry.value;
                      final isCover = img['isPrimary'] == true;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.network(
                              img['url'] as String,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
                            ),
                          ),
                          title: Text(
                            img['url'] as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12),
                          ),
                          subtitle: Text(
                            isCover ? '⭐ Primary Cover Photo' : 'Secondary photo',
                            style: TextStyle(
                              fontSize: 11,
                              color: isCover ? AppTheme.primaryEmeraldDark : Colors.grey,
                              fontWeight: isCover ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!isCover)
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      for (var item in _images) {
                                        item['isPrimary'] = false;
                                      }
                                      img['isPrimary'] = true;
                                    });
                                  },
                                  child: const Text('Make Cover', style: TextStyle(fontSize: 11)),
                                ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                onPressed: () {
                                  setState(() {
                                    _images.removeAt(idx);
                                    if (isCover && _images.isNotEmpty) {
                                      _images[0]['isPrimary'] = true;
                                    }
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 30),

                    ElevatedButton(
                      onPressed: _isSaving ? null : _saveChanges,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryEmerald,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ],
                ),
    );
  }
}
