import 'package:flutter/material.dart';
import 'package:rental_peshawar_mobile/core/models/saved_search_model.dart';
import 'package:rental_peshawar_mobile/core/models/property_model.dart';

class SimilarPropertiesCarousel extends StatelessWidget {
  final List<RecommendationItemModel> similarProperties;
  final Function(PropertyModel property)? onPropertyTap;

  const SimilarPropertiesCarousel({
    super.key,
    required this.similarProperties,
    this.onPropertyTap,
  });

  @override
  Widget build(BuildContext context) {
    if (similarProperties.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            '🏘️ Similar Properties',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: similarProperties.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final item = similarProperties[index];
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
                              'PKR ${prop.monthlyRentPkr.toInt()}',
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
