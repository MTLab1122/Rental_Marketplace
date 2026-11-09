class LocalityModel {
  final String id;
  final String name;
  final String slug;
  final String? postalCode;
  final double latitude;
  final double longitude;
  final String? description;
  final bool isActive;

  LocalityModel({
    required this.id,
    required this.name,
    required this.slug,
    this.postalCode,
    required this.latitude,
    required this.longitude,
    this.description,
    this.isActive = true,
  });

  factory LocalityModel.fromJson(Map<String, dynamic> json) {
    return LocalityModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      postalCode: json['postalCode'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      description: json['description'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'postalCode': postalCode,
      'latitude': latitude,
      'longitude': longitude,
      'description': description,
      'isActive': isActive,
    };
  }
}

