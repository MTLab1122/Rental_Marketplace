import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/peshawar_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/landlord_provider.dart';

class CreateListingWizardScreen extends ConsumerStatefulWidget {
  const CreateListingWizardScreen({super.key});

  @override
  ConsumerState<CreateListingWizardScreen> createState() =>
      _CreateListingWizardScreenState();
}

class _CreateListingWizardScreenState
    extends ConsumerState<CreateListingWizardScreen> {
  int _currentStep = 1;
  bool _isLoading = false;
  String? _errorMessage;

  // Form state
  String _eligibility = 'STUDENTS_ONLY';
  String _propertyType = 'SINGLE_ROOM';

  String _title = '';
  String _description = '';
  String _localityName = PeshawarConstants.localities.first;
  String _addressNote = '';
  double _latitude = 34.0151;
  double _longitude = 71.5249;

  int _monthlyRentPkr = 15000;
  int _securityDepositPkr = 15000;
  DateTime _availableFromDate = DateTime.now();

  int _bedrooms = 1;
  int _bathrooms = 1;
  double _areaSqFt = 250.0;
  String _furnishing = 'FURNISHED';
  final Set<String> _selectedAmenities = {'Water', 'Electricity', 'Internet / Wi-Fi'};

  final List<String> _imageUrls = [];
  int _primaryImageIndex = 0;

  bool _duplicateWarning = false;
  String? _duplicateDetails;
  bool _allowDuplicateBypass = false;

  final TextEditingController _urlInputCtrl = TextEditingController();

  List<String> get _availablePropertyTypes {
    if (_eligibility == 'STUDENTS_ONLY') {
      return ['SINGLE_ROOM', 'SHARED_ROOM', 'HOSTEL_BED', 'PORTION', 'APARTMENT'];
    } else {
      return ['FULL_HOUSE', 'UPPER_PORTION', 'LOWER_PORTION', 'APARTMENT'];
    }
  }

  final List<String> _allAmenities = [
    'Water',
    'Electricity',
    'Sui Gas',
    'Internet / Wi-Fi',
    'UPS / Generator Backup',
    'Car Parking',
    'Motorbike Parking',
    '24/7 Security Guard',
    'Separate Entrance',
    'Kitchen',
    'Balcony',
    'Attached Bathroom',
  ];

  @override
  void dispose() {
    _urlInputCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep == 3) {
      // Validate boundary
      if (!PeshawarConstants.isWithinPeshawarBoundary(_latitude, _longitude)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Coordinates are outside the Peshawar municipal boundary.'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    if (_currentStep == 6) {
      _runDuplicateCheck();
    }

    if (_currentStep < 7) {
      setState(() {
        _currentStep++;
      });
    }
  }

  void _prevStep() {
    if (_currentStep > 1) {
      setState(() {
        _currentStep--;
      });
    }
  }

  Future<void> _runDuplicateCheck() async {
    setState(() {
      _isLoading = true;
      _duplicateWarning = false;
      _duplicateDetails = null;
    });

    try {
      final client = ref.read(apiClientProvider);
      final res = await client.post(
        '/landlord/properties/check-duplicate',
        data: {
          'title': _title,
          'localityName': _localityName,
          'propertyType': _propertyType,
          'monthlyRentPkr': _monthlyRentPkr,
          'latitude': _latitude,
          'longitude': _longitude,
        },
      );
      final data = res.data['data'] ?? res.data;
      if (data != null && data['isDuplicate'] == true) {
        setState(() {
          _duplicateWarning = true;
          _duplicateDetails = data['existingProperty']?['title'] ?? 'Similar listing in same locality';
        });
      }
    } catch (_) {
      // If check fails gracefully continue
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _submitListing() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final client = ref.read(apiClientProvider);

      final imagesPayload = _imageUrls.asMap().entries.map((entry) {
        return {
          'url': entry.value,
          'isPrimary': entry.key == _primaryImageIndex,
          'sortOrder': entry.key,
        };
      }).toList();

      final payload = {
        'title': _title.trim(),
        'description': _description.trim(),
        'eligibility': _eligibility,
        'propertyType': _propertyType,
        'monthlyRentPkr': _monthlyRentPkr,
        'securityDepositPkr': _securityDepositPkr,
        'availableFromDate': _availableFromDate.toIso8601String().split('T').first,
        'bedrooms': _bedrooms,
        'bathrooms': _bathrooms,
        'areaSqFt': _areaSqFt,
        'furnishing': _furnishing,
        'localityName': _localityName,
        'addressNote': _addressNote.trim(),
        'latitude': _latitude,
        'longitude': _longitude,
        'amenities': _selectedAmenities.toList(),
        'images': imagesPayload,
        'allowDuplicateBypass': _allowDuplicateBypass,
      };

      await client.post('/properties', data: payload);

      ref.read(landlordPropertiesProvider.notifier).loadProperties();
      ref.read(landlordDashboardProvider.notifier).loadDashboard();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Listing submitted successfully! Awaiting moderation review.'),
            backgroundColor: AppTheme.primaryEmeraldDark,
          ),
        );
        context.go('/landlord/properties');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to submit listing. Please ensure all fields are valid.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('New Listing (Step $_currentStep of 7)'),
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: _currentStep / 7.0,
            backgroundColor: Colors.grey.shade200,
            color: AppTheme.primaryEmerald,
          ),
          if (_errorMessage != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: Colors.red.shade50,
              child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: _buildCurrentStepView(),
            ),
          ),
          _buildNavigationFooter(),
        ],
      ),
    );
  }

  Widget _buildCurrentStepView() {
    switch (_currentStep) {
      case 1:
        return _buildStep1Eligibility();
      case 2:
        return _buildStep2PropertyType();
      case 3:
        return _buildStep3Location();
      case 4:
        return _buildStep4Pricing();
      case 5:
        return _buildStep5Details();
      case 6:
        return _buildStep6Images();
      case 7:
        return _buildStep7ReviewAndSubmit();
      default:
        return const SizedBox.shrink();
    }
  }

  // --- STEP 1: ELIGIBILITY ---
  Widget _buildStep1Eligibility() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Choose Tenant Eligibility',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Peshawar rental marketplace strictly segregates student and family rentals for community comfort and safety.',
          style: TextStyle(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 20),
        _buildEligibilityCard(
          title: 'Students Only',
          description: 'Hostels, shared rooms, single rooms, or portions near University of Peshawar, UET, Islamia College, etc.',
          emoji: '🎓',
          value: 'STUDENTS_ONLY',
        ),
        const SizedBox(height: 14),
        _buildEligibilityCard(
          title: 'Families Only',
          description: 'Independent family portions, houses, or family apartments in residential sectors like Hayatabad, Town, etc.',
          emoji: '👨‍👩‍👧',
          value: 'FAMILIES_ONLY',
        ),
      ],
    );
  }

  Widget _buildEligibilityCard({
    required String title,
    required String description,
    required String emoji,
    required String value,
  }) {
    final isSelected = _eligibility == value;
    return InkWell(
      onTap: () {
        setState(() {
          _eligibility = value;
          _propertyType = _availablePropertyTypes.first;
        });
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryEmerald.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppTheme.primaryEmerald : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(description, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppTheme.primaryEmerald)
          ],
        ),
      ),
    );
  }

  // --- STEP 2: PROPERTY TYPE ---
  Widget _buildStep2PropertyType() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select ${_eligibility == 'STUDENTS_ONLY' ? 'Student' : 'Family'} Property Type',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Only property types compatible with your selected tenant eligibility are allowed.',
          style: TextStyle(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 16),
        ..._availablePropertyTypes.map((type) {
          final isSelected = _propertyType == type;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: RadioListTile<String>(
              value: type,
              groupValue: _propertyType,
              title: Text(type.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w600)),
              tileColor: isSelected ? AppTheme.primaryEmerald.withOpacity(0.06) : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: isSelected ? AppTheme.primaryEmerald : Colors.grey.shade200),
              ),
              activeColor: AppTheme.primaryEmerald,
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _propertyType = val;
                  });
                }
              },
            ),
          );
        }),
      ],
    );
  }

  // --- STEP 3: LOCATION ---
  Widget _buildStep3Location() {
    final isInsideBoundary = PeshawarConstants.isWithinPeshawarBoundary(_latitude, _longitude);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Property Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text(
          'All properties must be located within verified Peshawar localities.',
          style: TextStyle(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 16),
        const Text('Title / Headline', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: _title,
          decoration: const InputDecoration(
            hintText: 'e.g. Spacious 2 Bed Upper Portion near Canal Road',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) => _title = v,
        ),
        const SizedBox(height: 16),
        const Text('Locality', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _localityName,
          items: PeshawarConstants.localities
              .map((loc) => DropdownMenuItem(value: loc, child: Text(loc)))
              .toList(),
          decoration: const InputDecoration(border: OutlineInputBorder()),
          onChanged: (v) {
            if (v != null) setState(() => _localityName = v);
          },
        ),
        const SizedBox(height: 16),
        const Text('Street Address / Sector / Landmark', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: _addressNote,
          decoration: const InputDecoration(
            hintText: 'e.g. Street 4, Sector F-3, Near Bilal Masjid',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) => _addressNote = v,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Latitude', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    initialValue: _latitude.toString(),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    onChanged: (v) {
                      final n = double.tryParse(v);
                      if (n != null) setState(() => _latitude = n);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Longitude', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    initialValue: _longitude.toString(),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    onChanged: (v) {
                      final n = double.tryParse(v);
                      if (n != null) setState(() => _longitude = n);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isInsideBoundary ? const Color(0xFFECFDF5) : Colors.red.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isInsideBoundary ? const Color(0xFF10B981) : Colors.red.shade300,
            ),
          ),
          child: Row(
            children: [
              Icon(
                isInsideBoundary ? Icons.check_circle : Icons.error_outline,
                color: isInsideBoundary ? const Color(0xFF047857) : Colors.red.shade800,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isInsideBoundary
                      ? 'Coordinates verified within Peshawar Municipal Boundary'
                      : 'Coordinates are OUTSIDE Peshawar service boundary. Only Peshawar properties are permitted.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isInsideBoundary ? const Color(0xFF047857) : Colors.red.shade800,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- STEP 4: PRICING & AVAILABILITY ---
  Widget _buildStep4Pricing() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Pricing & Availability', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text('Enter transparent PKR rental terms.', style: TextStyle(fontSize: 13, color: Colors.grey)),
        const SizedBox(height: 16),
        const Text('Monthly Rent (PKR)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: _monthlyRentPkr.toString(),
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            prefixText: 'PKR ',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) {
            final n = int.tryParse(v);
            if (n != null) setState(() => _monthlyRentPkr = n);
          },
        ),
        const SizedBox(height: 16),
        const Text('Security Deposit (PKR)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: _securityDepositPkr.toString(),
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            prefixText: 'PKR ',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) {
            final n = int.tryParse(v);
            if (n != null) setState(() => _securityDepositPkr = n);
          },
        ),
        const SizedBox(height: 16),
        const Text('Available From Date', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        InkWell(
          onTap: () async {
            final d = await showDatePicker(
              context: context,
              initialDate: _availableFromDate,
              firstDate: DateTime.now().subtract(const Duration(days: 30)),
              lastDate: DateTime.now().add(const Duration(days: 365)),
            );
            if (d != null) setState(() => _availableFromDate = d);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade400),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(DateFormat('yyyy-MM-dd').format(_availableFromDate)),
                const Icon(Icons.calendar_today, size: 18),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // --- STEP 5: DETAILS & AMENITIES ---
  Widget _buildStep5Details() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Property Details & Amenities', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bedrooms', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    initialValue: _bedrooms.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    onChanged: (v) => _bedrooms = int.tryParse(v) ?? 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bathrooms', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    initialValue: _bathrooms.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    onChanged: (v) => _bathrooms = int.tryParse(v) ?? 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Area (sqft)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    initialValue: _areaSqFt.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    onChanged: (v) => _areaSqFt = double.tryParse(v) ?? 250,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text('Furnishing Status', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _furnishing,
          items: const [
            DropdownMenuItem(value: 'UNFURNISHED', child: Text('Unfurnished')),
            DropdownMenuItem(value: 'SEMI_FURNISHED', child: Text('Semi Furnished')),
            DropdownMenuItem(value: 'FURNISHED', child: Text('Fully Furnished')),
          ],
          decoration: const InputDecoration(border: OutlineInputBorder()),
          onChanged: (v) {
            if (v != null) setState(() => _furnishing = v);
          },
        ),
        const SizedBox(height: 16),
        const Text('Description', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: _description,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Detailed description of premises, utilities, rules, etc.',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) => _description = v,
        ),
        const SizedBox(height: 16),
        const Text('Select Amenities', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _allAmenities.map((amenity) {
            final isChecked = _selectedAmenities.contains(amenity);
            return FilterChip(
              label: Text(amenity),
              selected: isChecked,
              selectedColor: AppTheme.primaryEmerald.withOpacity(0.2),
              onSelected: (val) {
                setState(() {
                  if (val) {
                    _selectedAmenities.add(amenity);
                  } else {
                    _selectedAmenities.remove(amenity);
                  }
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  // --- STEP 6: IMAGE MANAGER ---
  Widget _buildStep6Images() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Listing Media (Up to 12 Images)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text(
          'Add high-quality image URLs. Designate a cover photo that appears first in search results.',
          style: TextStyle(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _urlInputCtrl,
                decoration: const InputDecoration(
                  hintText: 'Paste image URL (https://...)',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () {
                final url = _urlInputCtrl.text.trim();
                if (url.isNotEmpty && _imageUrls.length < 12) {
                  setState(() {
                    _imageUrls.add(url);
                    _urlInputCtrl.clear();
                  });
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryEmerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              child: const Text('Add'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_imageUrls.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: const Center(
              child: Text('No images added yet. Add at least 1 image URL.'),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _imageUrls.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.1,
            ),
            itemBuilder: (context, idx) {
              final isCover = idx == _primaryImageIndex;
              return Stack(
                children: [
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        _imageUrls[idx],
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.broken_image),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 6,
                    left: 6,
                    child: InkWell(
                      onTap: () {
                        setState(() => _primaryImageIndex = idx);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: isCover ? AppTheme.primaryEmerald : Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isCover ? 'Cover' : 'Set Cover',
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _imageUrls.removeAt(idx);
                          if (_primaryImageIndex >= _imageUrls.length) {
                            _primaryImageIndex = 0;
                          }
                        });
                      },
                      child: const CircleAvatar(
                        radius: 12,
                        backgroundColor: Colors.red,
                        child: Icon(Icons.close, size: 14, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
      ],
    );
  }

  // --- STEP 7: REVIEW & SUBMIT ---
  Widget _buildStep7ReviewAndSubmit() {
    final formatter = NumberFormat('#,###', 'en_PK');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Review & Submit for Moderation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text(
          'Please verify all listing information before submitting for admin review.',
          style: TextStyle(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 16),

        if (_duplicateWarning) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.amber.shade900),
                    const SizedBox(width: 8),
                    Text(
                      'Potential Duplicate Listing Detected',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'A similar listing was detected in ${_localityName} (${_duplicateDetails ?? ''}). If this is a separate listing, check below to confirm.',
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 8),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _allowDuplicateBypass,
                  activeColor: AppTheme.primaryEmerald,
                  title: const Text('Confirm this is an independent unit / portion and submit anyway', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  onChanged: (val) {
                    setState(() {
                      _allowDuplicateBypass = val ?? false;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Summary details card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_title.isNotEmpty ? _title : 'Untitled Listing', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Text('PKR ${formatter.format(_monthlyRentPkr)} / month', style: const TextStyle(color: AppTheme.primaryEmeraldDark, fontWeight: FontWeight.bold, fontSize: 15)),
              const Divider(height: 20),
              _buildSummaryRow('Eligibility', _eligibility == 'STUDENTS_ONLY' ? 'Students Only' : 'Families Only'),
              _buildSummaryRow('Property Type', _propertyType.replaceAll('_', ' ')),
              _buildSummaryRow('Locality', _localityName),
              _buildSummaryRow('Security Deposit', 'PKR ${formatter.format(_securityDepositPkr)}'),
              _buildSummaryRow('Bedrooms / Baths', '$_bedrooms Bed / $_bathrooms Bath'),
              _buildSummaryRow('Area', '$_areaSqFt sqft'),
              _buildSummaryRow('Furnishing', _furnishing),
              _buildSummaryRow('Images Count', '${_imageUrls.length} images'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildNavigationFooter() {
    final isLastStep = _currentStep == 7;
    final isSubmitDisabled = _isLoading || (_duplicateWarning && !_allowDuplicateBypass);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        children: [
          if (_currentStep > 1)
            OutlinedButton(
              onPressed: _prevStep,
              child: const Text('Back'),
            ),
          const Spacer(),
          if (!isLastStep)
            ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryEmerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('Next Step →'),
            )
          else
            ElevatedButton(
              onPressed: isSubmitDisabled ? null : _submitListing,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryEmerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Submit Listing'),
            ),
        ],
      ),
    );
  }
}
