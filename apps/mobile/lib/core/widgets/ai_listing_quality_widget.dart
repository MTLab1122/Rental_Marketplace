import 'package:flutter/material.dart';

/// AI Listing Quality Suggestion Item
class QualitySuggestionItem {
  final String id;
  final String type;
  final String title;
  final String message;
  final String? actionableStep;
  final String status;

  const QualitySuggestionItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.actionableStep,
    this.status = 'PENDING',
  });
}

/// AI-Assisted Listing Quality Assistant Widget for Landlord Wizard
class AiListingQualityWidget extends StatelessWidget {
  final List<QualitySuggestionItem> suggestions;
  final Function(String id, String status)? onUpdateStatus;
  final VoidCallback? onReanalyze;
  final bool isLoading;

  const AiListingQualityWidget({
    super.key,
    required this.suggestions,
    this.onUpdateStatus,
    this.onReanalyze,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final pending = suggestions.where((s) => s.status == 'PENDING').toList();

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Row(
                children: [
                  Text('✨', style: TextStyle(fontSize: 18)),
                  SizedBox(width: 8),
                  Text(
                    'AI Listing Quality Assistant',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              if (onReanalyze != null)
                TextButton(
                  onPressed: isLoading ? null : onReanalyze,
                  child: Text(
                    isLoading ? 'Auditing...' : 'Check Quality',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Ensure your Peshawar listing complies with photo clarity, power backup, and pricing standards.',
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 12),

          if (suggestions.isEmpty && !isLoading)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Ready to publish! High listing quality score.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF166534),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          if (pending.isNotEmpty)
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: pending.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = pending[index];
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          Text(
                            item.type,
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0284C7),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.message,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                      ),
                      if (item.actionableStep != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          '👉 ${item.actionableStep}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0284C7),
                          ),
                        ),
                      ],
                      if (onUpdateStatus != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            OutlinedButton(
                              onPressed: () => onUpdateStatus!(item.id, 'DISMISSED'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: const Text('Dismiss', style: TextStyle(fontSize: 10)),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: () => onUpdateStatus!(item.id, 'ACCEPTED'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0284C7),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: const Text('Apply', style: TextStyle(fontSize: 10, color: Colors.white)),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

/// Pricing Intelligence Card
class PricingInsightCard extends StatelessWidget {
  final int currentRentPkr;
  final int medianRentPkr;
  final int minRecommendedPkr;
  final int maxRecommendedPkr;
  final String priceContext; // BELOW_MARKET, AROUND_MARKET, ABOVE_MARKET
  final String localityName;

  const PricingInsightCard({
    super.key,
    required this.currentRentPkr,
    required this.medianRentPkr,
    required this.minRecommendedPkr,
    required this.maxRecommendedPkr,
    required this.priceContext,
    required this.localityName,
  });

  @override
  Widget build(BuildContext context) {
    Color badgeColor = const Color(0xFF16A34A);
    String badgeText = 'Around Market';

    if (priceContext == 'BELOW_MARKET') {
      badgeColor = const Color(0xFF0284C7);
      badgeText = 'Below Market';
    } else if (priceContext == 'ABOVE_MARKET') {
      badgeColor = const Color(0xFFD97706);
      badgeText = 'Above Market';
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(
                '$localityName Market Rent Benchmark',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0369A1),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildPriceCell('Locality Median', 'PKR ${medianRentPkr.toString()}'),
              const SizedBox(width: 8),
              _buildPriceCell('Competitive Min', 'PKR ${minRecommendedPkr.toString()}'),
              const SizedBox(width: 8),
              _buildPriceCell('Competitive Max', 'PKR ${maxRecommendedPkr.toString()}'),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            '⚠️ Estimates derived from active approved listings in Peshawar. Not a guaranteed price.',
            style: TextStyle(fontSize: 9, fontStyle: FontStyle.italic, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceCell(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFE0F2FE)),
        ),
        child: Column(
          children: [
            Text(label, style: const TextStyle(fontSize: 8, color: Color(0xFF64748B))),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tenant Trust and Safety Tips Card
class SafetyTipsCard extends StatelessWidget {
  const SafetyTipsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('🛡️', style: TextStyle(fontSize: 16)),
              SizedBox(width: 8),
              Text(
                'Peshawar Rental Safety Standards',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          SizedBox(height: 6),
          Text(
            '• Never send advance rent via JazzCash/EasyPaisa before viewing.\n• Verify physical property within active Peshawar boundary.\n• Review verified landlord CNIC badge before signing.',
            style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), height: 1.4),
          ),
        ],
      ),
    );
  }
}
