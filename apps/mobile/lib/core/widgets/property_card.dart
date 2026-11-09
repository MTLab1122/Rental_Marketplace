import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/property_model.dart';
import '../theme/app_theme.dart';

class PropertyCard extends StatelessWidget {
  final PropertyModel property;
  final bool isFavorited;
  final VoidCallback? onTap;
  final VoidCallback? onFavoriteToggle;

  const PropertyCard({
    super.key,
    required this.property,
    this.isFavorited = false,
    this.onTap,
    this.onFavoriteToggle,
  });

  @override
  Widget build(BuildContext context) {
    final isStudent = property.eligibility == PropertyEligibility.studentsOnly;
    final primaryImageUrl = property.images.isNotEmpty ? property.images.first.url : null;

    return Card(
      elevation: 2,
      shadowColor: Colors.black12,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Stack
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: primaryImageUrl != null && primaryImageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: primaryImageUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: Colors.grey.shade200,
                            child: const Center(
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.broken_image, size: 40, color: Colors.grey),
                          ),
                        )
                      : Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.apartment, size: 48, color: Colors.grey),
                        ),
                ),

                // Eligibility Badge
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isStudent ? AppTheme.studentsOnlyBg : AppTheme.familiesOnlyBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isStudent
                            ? AppTheme.studentsOnlyText.withOpacity(0.3)
                            : AppTheme.familiesOnlyText.withOpacity(0.3),
                      ),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
                      ],
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
                ),

                // Favorite Button
                Positioned(
                  top: 10,
                  right: 10,
                  child: Material(
                    color: Colors.white,
                    shape: const CircleBorder(),
                    elevation: 2,
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: onFavoriteToggle,
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Icon(
                          isFavorited ? Icons.favorite : Icons.favorite_border,
                          size: 20,
                          color: isFavorited ? Colors.red : Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ),
                ),

                // Featured Badge
                if (property.isFeatured)
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryEmerald,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'FEATURED',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // Card Body
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Price and Type
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        property.formattedRent,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textDark,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          property.propertyTypeLabel,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Title
                  Text(
                    property.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Locality
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: AppTheme.primaryEmerald),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          property.localityName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Specs (Bedrooms, Bathrooms, Area)
                  Divider(height: 1, color: Colors.grey.shade200),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildSpec(Icons.bed, '${property.bedrooms} Beds'),
                      const SizedBox(width: 16),
                      _buildSpec(Icons.bathtub_outlined, '${property.bathrooms} Baths'),
                      if (property.areaSqFt != null) ...[
                        const SizedBox(width: 16),
                        _buildSpec(Icons.square_foot, '${property.areaSqFt!.toInt()} sqft'),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpec(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 15, color: Colors.grey.shade600),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade700,
          ),
        ),
      ],
    );
  }
}

