import 'package:intl/intl.dart';

enum PropertyEligibility {
  studentsOnly,
  familiesOnly,
}

enum PropertyType {
  singleRoom,
  sharedRoom,
  hostelBed,
  fullHouse,
  upperPortion,
  lowerPortion,
  apartment,
  studio,
}

class PropertyImageModel {
  final String id;
  final String url;
  final String? caption;
  final bool isPrimary;
  final int sortOrder;

  PropertyImageModel({
    required this.id,
    required this.url,
    this.caption,
    this.isPrimary = false,
    this.sortOrder = 0,
  });

  factory PropertyImageModel.fromJson(Map<String, dynamic> json) {
    return PropertyImageModel(
      id: json['id'] as String? ?? '',
      url: json['url'] as String,
      caption: json['caption'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class AmenityModel {
  final String id;
  final String name;
  final String code;
  final String? icon;

  AmenityModel({
    required this.id,
    required this.name,
    required this.code,
    this.icon,
  });

  factory AmenityModel.fromJson(Map<String, dynamic> json) {
    return AmenityModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      icon: json['icon'] as String?,
    );
  }
}

class PropertyModel {
  final String id;
  final String title;
  final String slug;
  final String? description;
  final PropertyEligibility eligibility;
  final PropertyType propertyType;
  final int monthlyRentPkr;
  final int securityDepositPkr;
  final int bedrooms;
  final int bathrooms;
  final double? areaSqFt;
  final String? furnishing;
  final String? localityId;
  final String localityName;
  final String? addressNote;
  final double latitude;
  final double longitude;
  final bool isAvailable;
  final bool isFeatured;
  final int viewCount;
  final int inquiryCount;
  final int favoriteCount;
  final List<PropertyImageModel> images;
  final List<AmenityModel> amenities;
  final DateTime? createdAt;

  PropertyModel({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    required this.eligibility,
    required this.propertyType,
    required this.monthlyRentPkr,
    required this.securityDepositPkr,
    required this.bedrooms,
    required this.bathrooms,
    this.areaSqFt,
    this.furnishing,
    this.localityId,
    required this.localityName,
    this.addressNote,
    required this.latitude,
    required this.longitude,
    this.isAvailable = true,
    this.isFeatured = false,
    this.viewCount = 0,
    this.inquiryCount = 0,
    this.favoriteCount = 0,
    this.images = const [],
    this.amenities = const [],
    this.createdAt,
  });

  String get formattedRent {
    final formatter = NumberFormat('#,###', 'en_PK');
    return 'PKR ${formatter.format(monthlyRentPkr)}/mo';
  }

  String get formattedDeposit {
    final formatter = NumberFormat('#,###', 'en_PK');
    return 'PKR ${formatter.format(securityDepositPkr)}';
  }

  String get eligibilityLabel {
    return eligibility == PropertyEligibility.studentsOnly ? 'Students Only' : 'Families Only';
  }

  String get propertyTypeLabel {
    switch (propertyType) {
      case PropertyType.singleRoom:
        return 'Single Room';
      case PropertyType.sharedRoom:
        return 'Shared Room';
      case PropertyType.hostelBed:
        return 'Hostel Bed';
      case PropertyType.fullHouse:
        return 'Full House';
      case PropertyType.upperPortion:
        return 'Upper Portion';
      case PropertyType.lowerPortion:
        return 'Lower Portion';
      case PropertyType.apartment:
        return 'Apartment';
      case PropertyType.studio:
        return 'Studio';
    }
  }

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    PropertyEligibility parseEligibility(String? e) {
      if (e == 'FAMILIES_ONLY') return PropertyEligibility.familiesOnly;
      return PropertyEligibility.studentsOnly;
    }

    PropertyType parsePropertyType(String? t) {
      switch (t) {
        case 'SINGLE_ROOM':
          return PropertyType.singleRoom;
        case 'SHARED_ROOM':
          return PropertyType.sharedRoom;
        case 'HOSTEL_BED':
          return PropertyType.hostelBed;
        case 'FULL_HOUSE':
          return PropertyType.fullHouse;
        case 'UPPER_PORTION':
          return PropertyType.upperPortion;
        case 'LOWER_PORTION':
          return PropertyType.lowerPortion;
        case 'APARTMENT':
          return PropertyType.apartment;
        case 'STUDIO':
          return PropertyType.studio;
        default:
          return PropertyType.apartment;
      }
    }

    // Coordinates can come from `coordinates` object or root lat/lng
    double lat = 34.0151; // Peshawar default
    double lng = 71.5249;
    if (json['coordinates'] != null && json['coordinates'] is Map) {
      lat = (json['coordinates']['latitude'] as num?)?.toDouble() ?? lat;
      lng = (json['coordinates']['longitude'] as num?)?.toDouble() ?? lng;
    } else {
      lat = (json['latitude'] as num?)?.toDouble() ?? lat;
      lng = (json['longitude'] as num?)?.toDouble() ?? lng;
    }

    // Locality name can come from `localityName` or `locality.name`
    String locName = 'Peshawar';
    if (json['locality'] != null && json['locality'] is Map) {
      locName = json['locality']['name'] as String? ?? locName;
    } else if (json['localityName'] != null) {
      locName = json['localityName'] as String;
    }

    List<PropertyImageModel> imgs = [];
    if (json['images'] != null && json['images'] is List) {
      imgs = (json['images'] as List)
          .map((item) => PropertyImageModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    List<AmenityModel> amens = [];
    if (json['amenities'] != null && json['amenities'] is List) {
      amens = (json['amenities'] as List)
          .map((item) => AmenityModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return PropertyModel(
      id: json['id'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String? ?? json['id'] as String,
      description: json['description'] as String?,
      eligibility: parseEligibility(json['eligibility'] as String?),
      propertyType: parsePropertyType(json['propertyType'] as String?),
      monthlyRentPkr: (json['monthlyRentPkr'] as num?)?.toInt() ?? 0,
      securityDepositPkr: (json['securityDepositPkr'] as num?)?.toInt() ?? 0,
      bedrooms: (json['bedrooms'] as num?)?.toInt() ?? 0,
      bathrooms: (json['bathrooms'] as num?)?.toInt() ?? 0,
      areaSqFt: (json['areaSqFt'] as num?)?.toDouble(),
      furnishing: json['furnishing'] as String?,
      localityId: json['localityId'] as String?,
      localityName: locName,
      addressNote: json['addressNote'] as String?,
      latitude: lat,
      longitude: lng,
      isAvailable: json['isAvailable'] as bool? ?? true,
      isFeatured: json['isFeatured'] as bool? ?? false,
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      inquiryCount: (json['inquiryCount'] as num?)?.toInt() ?? 0,
      favoriteCount: (json['favoriteCount'] as num?)?.toInt() ?? 0,
      images: imgs,
      amenities: amens,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
    );
  }
}
