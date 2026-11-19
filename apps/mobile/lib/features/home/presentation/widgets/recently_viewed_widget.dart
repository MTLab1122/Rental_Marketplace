import 'package:flutter/material.dart';
import 'package:rental_peshawar_mobile/core/models/property_model.dart';

class RecentlyViewedWidget extends StatelessWidget {
  final List<PropertyModel> recentlyViewed;
  final Function(PropertyModel property)? onPropertyTap;

  const RecentlyViewedWidget({
    super.key,
    required this.recentlyViewed,
    this.onPropertyTap,
  });

  @override
  Widget build(BuildContext context) {
    if (recentlyViewed.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            '🕒 Recently Viewed',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: recentlyViewed.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final prop = recentlyViewed[index];
              return InkWell(
                onTap: () => onPropertyTap?.call(prop),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 170,
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
                          height: 85,
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
                            const SizedBox(height: 4),
                            Text(
                              'PKR ${prop.monthlyRentPkr.toInt()} /mo',
                              style: const TextStyle(
                                fontSize: 11,
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
