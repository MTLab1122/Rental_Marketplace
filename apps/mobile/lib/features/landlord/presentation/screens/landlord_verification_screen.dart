import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/providers/landlord_provider.dart';

class LandlordVerificationScreen extends ConsumerStatefulWidget {
  const LandlordVerificationScreen({super.key});

  @override
  ConsumerState<LandlordVerificationScreen> createState() =>
      _LandlordVerificationScreenState();
}

class _LandlordVerificationScreenState
    extends ConsumerState<LandlordVerificationScreen> {
  final _formKey = GlobalKey<FormState>();

  String _cnicNumber = '';
  String _frontImageUrl = '';
  String _backImageUrl = '';
  String _selfieUrl = '';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(landlordVerificationProvider);
    final ver = state.verification;
    final status = ver?['status'] as String? ?? 'UNVERIFIED';
    final rejectionReason = ver?['rejectionReason'] as String?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Identity & CNIC Verification'),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildStatusBanner(status, rejectionReason),
                const SizedBox(height: 20),

                if (status == 'APPROVED')
                  _buildVerifiedDetails(ver!)
                else if (status == 'PENDING')
                  _buildPendingDetails(ver!)
                else
                  _buildSubmissionForm(state.isSubmitting),
              ],
            ),
    );
  }

  Widget _buildStatusBanner(String status, String? rejectionReason) {
    if (status == 'APPROVED') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFECFDF5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF10B981)),
        ),
        child: const Row(
          children: [
            Icon(Icons.verified, color: Color(0xFF047857), size: 36),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Identity Verified',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF047857)),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Your Pakistani CNIC identity has been verified by platform administrators. You can publish properties freely.',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (status == 'PENDING') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.amber.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.amber.shade300),
        ),
        child: Row(
          children: [
            Icon(Icons.hourglass_empty, color: Colors.amber.shade800, size: 36),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Documents Under Review',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.amber.shade900),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Your CNIC documents and selfie are being reviewed by the Peshawar verification team. Turnaround is typically within 24 hours.',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (status == 'REJECTED') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.shade300),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.cancel, color: Colors.red.shade800, size: 32),
                const SizedBox(width: 12),
                Text(
                  'Verification Rejected',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.red.shade900),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Reason: ${rejectionReason ?? 'Documents could not be clearly verified. Please review and re-submit.'}',
              style: TextStyle(fontSize: 13, color: Colors.red.shade800, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 6),
            const Text(
              'You may submit corrected CNIC photos and a fresh selfie below.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: const Row(
        children: [
          Icon(Icons.shield_outlined, color: Colors.blue, size: 36),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CNIC Verification Required',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.blue),
                ),
                SizedBox(height: 2),
                Text(
                  'To prevent scam listings and safeguard Peshawar tenants, all landlords must verify their NADRA CNIC.',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifiedDetails(Map<String, dynamic> ver) {
    final docNumber = ver['documentNumber'] as String? ?? '';
    final reviewedAt = ver['reviewedAt'] as String? ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Verification Record', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const Divider(height: 20),
          _buildRow('Document Type', 'National Identity Card (CNIC)'),
          _buildRow('Masked CNIC', docNumber.isNotEmpty ? docNumber : '17301-*******-1'),
          _buildRow('Status', 'Approved & Active'),
          if (reviewedAt.isNotEmpty) _buildRow('Approved At', reviewedAt),
        ],
      ),
    );
  }

  Widget _buildPendingDetails(Map<String, dynamic> ver) {
    final docNumber = ver['documentNumber'] as String? ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Submitted Application', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const Divider(height: 20),
          _buildRow('Document Type', 'CNIC'),
          _buildRow('Submitted Number', docNumber),
          _buildRow('Queue Status', 'In Review Queue'),
        ],
      ),
    );
  }

  Widget _buildSubmissionForm(bool isSubmitting) {
    return Form(
      key: _formKey,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Submit Identity Documents', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),

            const Text('Pakistani CNIC Number (13 digits)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                hintText: 'e.g. 17301-1234567-1',
                border: OutlineInputBorder(),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'CNIC number is required';
                final clean = v.replaceAll('-', '').trim();
                if (clean.length != 13 || int.tryParse(clean) == null) {
                  return 'Please enter a valid 13-digit CNIC number';
                }
                return null;
              },
              onSaved: (v) => _cnicNumber = v ?? '',
            ),
            const SizedBox(height: 16),

            const Text('CNIC Front Photo URL', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              decoration: const InputDecoration(
                hintText: 'https://...',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'CNIC front photo is required' : null,
              onSaved: (v) => _frontImageUrl = v ?? '',
            ),
            const SizedBox(height: 16),

            const Text('CNIC Back Photo URL', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              decoration: const InputDecoration(
                hintText: 'https://...',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'CNIC back photo is required' : null,
              onSaved: (v) => _backImageUrl = v ?? '',
            ),
            const SizedBox(height: 16),

            const Text('Selfie / Liveness Photo URL', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              decoration: const InputDecoration(
                hintText: 'https://...',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Selfie photo is required' : null,
              onSaved: (v) => _selfieUrl = v ?? '',
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryEmerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(double.infinity, 48),
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Submit for Verification', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      _formKey.currentState?.save();
      final ok = await ref.read(landlordVerificationProvider.notifier).submitVerification(
            cnicNumber: _cnicNumber.trim(),
            cnicFrontUrl: _frontImageUrl.trim(),
            cnicBackUrl: _backImageUrl.trim(),
            selfieUrl: _selfieUrl.trim(),
          );
      if (ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification submitted! Admin will review shortly.'),
            backgroundColor: AppTheme.primaryEmeraldDark,
          ),
        );
      }
    }
  }
}

