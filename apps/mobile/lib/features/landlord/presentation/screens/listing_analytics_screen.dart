import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/providers/auth_provider.dart';

class ListingAnalyticsScreen extends ConsumerStatefulWidget {
  final String propertyId;

  const ListingAnalyticsScreen({super.key, required this.propertyId});

  @override
  ConsumerState<ListingAnalyticsScreen> createState() =>
      _ListingAnalyticsScreenState();
}

class _ListingAnalyticsScreenState extends ConsumerState<ListingAnalyticsScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _analytics;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final client = ref.read(apiClientProvider);
      final res =
          await client.get('/landlord/properties/${widget.propertyId}/analytics');
      final data = res.data['data'] ?? res.data;

      setState(() {
        _analytics = data as Map<String, dynamic>?;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load property analytics';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final qualityScore = (_analytics?['qualityScore'] as num?)?.toInt() ?? 0;
    final totalViews = (_analytics?['totalViews'] as num?)?.toInt() ?? 0;
    final uniqueViewers = (_analytics?['uniqueViewers'] as num?)?.toInt() ?? 0;
    final totalInquiries = (_analytics?['totalInquiries'] as num?)?.toInt() ?? 0;
    final favoriteCount = (_analytics?['favoriteCount'] as num?)?.toInt() ?? 0;
    final responseRate = (_analytics?['inquiryResponseRate'] as num?)?.toDouble() ?? 0.0;
    final avgResponseTime = (_analytics?['averageResponseMinutes'] as num?)?.toInt();
    final sources = _analytics?['viewsBySource'] as Map<String, dynamic>? ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Listing Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchAnalytics,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _fetchAnalytics, child: const Text('Retry')),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Listing Quality Score Card
                    _buildQualityScoreCard(qualityScore),
                    const SizedBox(height: 16),

                    // Primary Metrics Grid
                    const Text('Performance Telemetry', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            'Total Views',
                            '$totalViews',
                            '$uniqueViewers unique viewers',
                            Icons.visibility_outlined,
                            Colors.blue,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricTile(
                            'Inquiries',
                            '$totalInquiries',
                            'Direct tenant leads',
                            Icons.chat_bubble_outline,
                            AppTheme.primaryEmerald,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            'Favorites',
                            '$favoriteCount',
                            'Saved by tenants',
                            Icons.favorite_border,
                            Colors.rose,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricTile(
                            'Response Rate',
                            '${(responseRate * 100).toStringAsFixed(0)}%',
                            avgResponseTime != null ? 'Avg $avgResponseTime min' : 'No responses yet',
                            Icons.speed,
                            AppTheme.accentTerracotta,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Traffic Sources Breakdown
                    const Text('Views by Platform Source', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        children: [
                          _buildSourceRow('Mobile App (Flutter)', sources['MOBILE'] ?? 0, totalViews),
                          const Divider(height: 16),
                          _buildSourceRow('Web (Next.js)', sources['WEB'] ?? 0, totalViews),
                          const Divider(height: 16),
                          _buildSourceRow('Admin / Direct Link', sources['DIRECT'] ?? 0, totalViews),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildQualityScoreCard(int score) {
    Color barColor = Colors.red;
    String rating = 'Needs Improvement';

    if (score >= 80) {
      barColor = AppTheme.primaryEmerald;
      rating = 'Excellent Quality';
    } else if (score >= 50) {
      barColor = Colors.amber;
      rating = 'Good Quality';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Listing Quality Score', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              Text('$score / 100', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: barColor)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (score / 100.0).clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              color: barColor,
            ),
          ),
          const SizedBox(height: 10),
          Text(rating, style: TextStyle(fontWeight: FontWeight.w600, color: barColor, fontSize: 13)),
          const SizedBox(height: 6),
          Text(
            'High quality listings receive up to 3x more tenant inquiries in Peshawar. Complete all details, upload 5+ clear photos, and specify amenities to maximize your score.',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile(
    String label,
    String value,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
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
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  Widget _buildSourceRow(String label, dynamic count, int total) {
    final intCount = (count as num?)?.toInt() ?? 0;
    final pct = total > 0 ? (intCount / total * 100).toStringAsFixed(0) : '0';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        Text('$intCount views ($pct%)', style: TextStyle(fontSize: 13, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
