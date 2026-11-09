enum UserRole {
  tenant,
  landlord,
  admin,
  superAdmin,
}

enum TenantType {
  student,
  family,
}

class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final UserRole role;
  final TenantType? tenantType;
  final bool isVerified;
  final String? institutionName;
  final String? businessName;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.role,
    this.tenantType,
    required this.isVerified,
    this.institutionName,
    this.businessName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    UserRole parseRole(String? r) {
      switch (r) {
        case 'LANDLORD':
          return UserRole.landlord;
        case 'ADMIN':
          return UserRole.admin;
        case 'SUPER_ADMIN':
          return UserRole.superAdmin;
        default:
          return UserRole.tenant;
      }
    }

    TenantType? parseTenantType(String? t) {
      if (t == 'STUDENT') return TenantType.student;
      if (t == 'FAMILY') return TenantType.family;
      return null;
    }

    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      phoneNumber: json['phoneNumber'] as String? ?? '',
      role: parseRole(json['role'] as String?),
      tenantType: parseTenantType(json['tenantType'] as String?),
      isVerified: json['isVerified'] as bool? ?? false,
      institutionName: json['institutionName'] as String?,
      businessName: json['businessName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'role': role.name.toUpperCase(),
      'tenantType': tenantType == TenantType.student ? 'STUDENT' : (tenantType == TenantType.family ? 'FAMILY' : null),
      'isVerified': isVerified,
      'institutionName': institutionName,
      'businessName': businessName,
    };
  }
}

