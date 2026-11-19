import 'package:flutter/material.dart';
import 'package:rental_peshawar_mobile/core/models/property_model.dart';
import 'package:rental_peshawar_mobile/core/models/saved_search_model.dart';

class TrendingPropertiesWidget extends StatelessWidget {
  final List<RecommendationItemModel> trending;
  final Function(PropertyModel property)? onPropertyTap;

  const TrendingPropertiesWidget({
    super.key,
    required this.trending,
    this.onPropertyTap,
  });

  @override
  Widget build(BuildContext context) {
    if (trending.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            '🔥 Trending in Peshawar',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: trending.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final item = trending[index];
              final prop = item.property;

              return InkWell(
                onTap: () => onPropertyTap?.call(prop),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 180,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Stack(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                            child: Container(
                              height: 95,
                              width: double.infinity,
                              color: const Color(0xFFE2E8F0),
                              child: prop.images.isNotEmpty
                                  ? Image.network(
                                      prop.images.first.url,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Center(
                                        child: Icon(Icons.home, color: Colors.black26),
                                      ),
                                    )
                                  : const Center(
                                      child: Icon(Icons.home, color: Colors.black26),
                                    ),
                            ),
                          ),
                          Positioned(
                            top: 6,
                            left: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.redAccent,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                '🔥 HOT',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              prop.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '📍 ${prop.localityName}',
                              style: const TextStyle(fontSize: 10, color: Colors.black54),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'PKR ${prop.monthlyRentPkr.toInt()} /mo',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0284C7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
