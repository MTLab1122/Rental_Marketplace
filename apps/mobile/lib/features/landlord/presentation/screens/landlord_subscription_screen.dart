import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';

class LandlordSubscriptionScreen extends ConsumerStatefulWidget {
  const LandlordSubscriptionScreen({super.key});

  @override
  ConsumerState<LandlordSubscriptionScreen> createState() =>
      _LandlordSubscriptionScreenState();
}

class _LandlordSubscriptionScreenState
    extends ConsumerState<LandlordSubscriptionScreen> {
  String _selectedPlan = 'PRO';
  final _promoController = TextEditingController();
  final _txRefController = TextEditingController();
  int _discountPct = 0;
  String? _promoMessage;
  bool _submitted = false;

  void _applyPromo() {
    final code = _promoController.text.trim().toUpperCase();
    setState(() {
      if (code == 'PESHAWAR2026' || code == 'WELCOME20') {
        _discountPct = 20;
        _promoMessage = '✓ 20% discount applied!';
      } else if (code == 'FIRSTBOOST50') {
        _discountPct = 50;
        _promoMessage = '✓ 50% discount applied!';
      } else {
        _discountPct = 0;
        _promoMessage = 'Invalid promo code';
      }
    });
  }

  void _submitOfflinePayment() {
    if (_txRefController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter transaction reference number')),
      );
      return;
    }
    setState(() {
      _submitted = true;
    });
  }

  @override
  void dispose() {
    _promoController.disposeProject();
    _txRefController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const plans = [
      {
        'id': 'STARTER',
        'name': 'Starter Landlord',
        'price': 'Free Forever',
        'rawPrice': 0,
        'listings': 'Up to 2 Active Listings',
        'features': [
          'Direct tenant chat & inquiries',
          'Standard Peshawar moderation',
          'Free digital tenancy agreements',
        ],
      },
      {
        'id': 'PRO',
        'name': 'Pro Landlord',
        'price': 'PKR 3,500 / month',
        'rawPrice': 3500,
        'listings': 'Up to 8 Active Listings',
        'features': [
          'Priority moderation (< 2 hours)',
          'Verified Landlord Gold Shield',
          '2 Free Featured boosts / month',
          'Instant WhatsApp inquiry notifications',
        ],
      },
      {
        'id': 'AGENCY',
        'name': 'Hostel & Agency Suite',
        'price': 'PKR 9,500 / month',
        'rawPrice': 9500,
        'listings': 'Up to 35 Active Listings',
        'features': [
          'Instant moderation bypass',
          '10 Free Featured boosts / month',
          'Bulk listing CSV import',
          'Dedicated Peshawar account manager',
        ],
      },
    ];

    final currentSelected = plans.firstWhere((p) => p['id'] == _selectedPlan);
    final raw = currentSelected['rawPrice'] as int;
    final discount = (raw * _discountPct) ~/ 100;
    final finalPrice = raw - discount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Plans & Boosts'),
      ),
      body: _submitted
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle_outline,
                        color: AppTheme.primaryEmerald, size: 72),
                    const SizedBox(height: 16),
                    const Text(
                      'Payment Reference Received!',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ref: ${_txRefController.text}\nOur billing desk will verify the transfer within 30 minutes and activate your tier.',
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryEmerald,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Back to Dashboard'),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryNavy,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Peshawar Landlord Membership',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          '0% Broker Commission • Connect directly with verified families & students across KP.',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  const Text(
                    'Select Landlord Tier',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  // Plans List
                  ...plans.map((plan) {
                    final isSelected = _selectedPlan == plan['id'];
                    return GestureDetector(
                      onTap: () => setState(() => _selectedPlan = plan['id'] as String),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.emerald.shade50 : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryEmerald : Colors.grey.shade300,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  plan['name'] as String,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  plan['price'] as String,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isSelected
                                        ? AppTheme.primaryEmerald
                                        : Colors.grey.shade800,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              plan['listings'] as String,
                              style: const TextStyle(
                                color: Colors.blueGrey,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const Divider(height: 20),
                            ...(plan['features'] as List<String>).map(
                              (feat) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    const Icon(Icons.check,
                                        size: 16, color: AppTheme.primaryEmerald),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        feat,
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 16),

                  // Promo Code Box
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Promo Code',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _promoController,
                                textCapitalization: TextCapitalization.characters,
                                decoration: const InputDecoration(
                                  hintText: 'e.g. PESHAWAR2026',
                                  isDense: true,
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: _applyPromo,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryNavy,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Apply'),
                            ),
                          ],
                        ),
                        if (_promoMessage != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            _promoMessage!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _discountPct > 0 ? Colors.green : Colors.red,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Offline Payment Instructions
                  if (raw > 0) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Offline Payment Details',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Meezan Bank Ltd (Peshawar Saddar)\n'
                            'Title: Peshawar Rentals Pvt Ltd\n'
                            'IBAN: PK65MEZN0001020304050607\n'
                            'JazzCash / EasyPaisa: 0300 1234567',
                            style: TextStyle(fontSize: 12, fontFamily: 'monospace'),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _txRefController,
                            decoration: const InputDecoration(
                              labelText: 'Transaction Reference / Slip ID',
                              hintText: 'e.g. TID-98234512',
                              isDense: true,
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Checkout Summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Plan Total:'),
                            Text(
                              raw == 0 ? 'Free' : 'PKR $raw',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        if (_discountPct > 0) ...[
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Promo ($_discountPct%):'),
                              Text(
                                '- PKR $discount',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                        ],
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Payable Amount:',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              finalPrice == 0 ? 'Free' : 'PKR $finalPrice',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: AppTheme.primaryEmerald,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: raw == 0
                          ? () => Navigator.of(context).pop()
                          : _submitOfflinePayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryEmerald,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        raw == 0 ? 'Activate Free Starter' : 'Submit Bank Payment',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
    );
  }
}

extension on TextEditingController {
  void disposeProject() {
    dispose();
  }
}
