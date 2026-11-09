import { PrismaClient, UserRoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  PESHAWAR_LOCALITIES_CONFIG,
  PESHAWAR_SERVICE_BOUNDARY_POLYGON,
} from '@rental-peshawar/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Peshawar Rental Marketplace database seeding...');

  // 1. Roles
  const rolesData = [
    {
      name: UserRoleName.SUPER_ADMIN,
      description: 'Super Administrator with complete system access and security governance',
    },
    {
      name: UserRoleName.ADMIN,
      description:
        'Administrative staff with listing moderation, report handling, and user verification access',
    },
    { name: UserRoleName.LANDLORD, description: 'Verified property owner or real estate manager' },
    {
      name: UserRoleName.TENANT,
      description: 'Registered tenant (Student or Family classification)',
    },
  ];

  const rolesMap = new Map<UserRoleName, string>();

  for (const roleItem of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: roleItem.name },
      update: { description: roleItem.description },
      create: roleItem,
    });
    rolesMap.set(role.name, role.id);
  }
  console.log('✅ System roles seeded.');

  // 2. Granular Permissions
  const permissionsData = [
    // Property Permissions
    {
      code: 'property:create',
      module: 'property',
      description: 'Create new property listings in DRAFT status',
    },
    {
      code: 'property:read_all',
      module: 'property',
      description: 'Read all properties including unapproved',
    },
    {
      code: 'property:update_own',
      module: 'property',
      description: 'Update own property listings',
    },
    {
      code: 'property:update_any',
      module: 'property',
      description: 'Modify any listing regardless of owner',
    },
    {
      code: 'property:delete_own',
      module: 'property',
      description: 'Soft delete own property listings',
    },
    {
      code: 'property:delete_any',
      module: 'property',
      description: 'Soft delete any property listing',
    },
    {
      code: 'property:approve',
      module: 'property',
      description: 'Approve pending property listings for public discovery',
    },
    {
      code: 'property:reject',
      module: 'property',
      description: 'Reject submitted property listings',
    },
    {
      code: 'property:suspend',
      module: 'property',
      description: 'Suspend active public properties',
    },

    // Locality & Geo Permissions
    {
      code: 'locality:manage',
      module: 'locality',
      description: 'Create, update, or archive Peshawar localities',
    },

    // Inquiries & Messaging Permissions
    {
      code: 'inquiry:create',
      module: 'inquiry',
      description: 'Submit rental inquiry for eligible property',
    },
    { code: 'inquiry:read_own', module: 'inquiry', description: 'View own rental inquiries' },
    { code: 'inquiry:respond', module: 'inquiry', description: 'Respond to tenant inquiries' },

    // User Governance & Moderation
    { code: 'user:read_all', module: 'user', description: 'Inspect all platform users' },
    { code: 'user:suspend', module: 'user', description: 'Suspend abusive or fraudulent users' },
    {
      code: 'user:verify',
      module: 'user',
      description: 'Verify landlord CNICs and student ID cards',
    },
    {
      code: 'admin:manage',
      module: 'admin',
      description: 'Manage admin roles and security parameters',
    },
    {
      code: 'audit:read',
      module: 'audit',
      description: 'Access audit logs and compliance history',
    },
  ];

  const permissionIds: { id: string; code: string }[] = [];

  for (const perm of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
    permissionIds.push({ id: permission.id, code: permission.code });
  }
  console.log(`✅ ${permissionIds.length} permissions seeded.`);

  // Associate Permissions with Roles
  const superAdminRoleId = rolesMap.get(UserRoleName.SUPER_ADMIN)!;
  const adminRoleId = rolesMap.get(UserRoleName.ADMIN)!;
  const landlordRoleId = rolesMap.get(UserRoleName.LANDLORD)!;
  const tenantRoleId = rolesMap.get(UserRoleName.TENANT)!;

  for (const perm of permissionIds) {
    // SUPER_ADMIN has every permission
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRoleId, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRoleId, permissionId: perm.id },
    });

    // ADMIN has moderation permissions
    if (
      perm.code.startsWith('property:approve') ||
      perm.code.startsWith('property:reject') ||
      perm.code.startsWith('property:suspend') ||
      perm.code.startsWith('property:read_all') ||
      perm.code.startsWith('user:') ||
      perm.code.startsWith('locality:') ||
      perm.code.startsWith('audit:read')
    ) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRoleId, permissionId: perm.id },
      });
    }

    // LANDLORD permissions
    if (
      perm.code === 'property:create' ||
      perm.code === 'property:update_own' ||
      perm.code === 'property:delete_own' ||
      perm.code === 'inquiry:respond'
    ) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: landlordRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: landlordRoleId, permissionId: perm.id },
      });
    }

    // TENANT permissions
    if (perm.code === 'inquiry:create' || perm.code === 'inquiry:read_own') {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: tenantRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: tenantRoleId, permissionId: perm.id },
      });
    }
  }

  // 3. Initial Super Admin User
  const adminEmail = process.env['ADMIN_EMAIL'] || 'admin@rentalpeshawar.pk';
  const adminPassword = process.env['ADMIN_PASSWORD'] || 'PeshawarAdmin2026!#';
  const adminPhone = process.env['ADMIN_PHONE'] || '+923001234567';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isVerified: true,
      fullName: 'Chief Administrator (Peshawar)',
      phoneNumber: adminPhone,
    },
    create: {
      email: adminEmail,
      phoneNumber: adminPhone,
      passwordHash,
      fullName: 'Chief Administrator (Peshawar)',
      isVerified: true,
      adminProfile: {
        create: {
          department: 'Executive Governance',
          designation: 'Lead Platform Administrator',
          canModerate: true,
        },
      },
    },
  });

  // Ensure Admin has SUPER_ADMIN role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRoleId },
  });
  console.log(`✅ Default Super Admin created: ${adminEmail}`);

  // 4. Initial Standard Amenities
  const amenitiesData = [
    { name: 'Backup Generator / UPS', code: 'BACKUP_POWER', category: 'UTILITIES', icon: 'bolt' },
    {
      name: 'High-Speed Internet (Fiber)',
      code: 'HIGH_SPEED_WIFI',
      category: 'UTILITIES',
      icon: 'wifi',
    },
    { name: 'Attached Bathroom', code: 'ATTACHED_BATH', category: 'COMFORT', icon: 'bathtub' },
    {
      name: 'Dedicated Car Parking',
      code: 'CAR_PARKING',
      category: 'FACILITIES',
      icon: 'directions_car',
    },
    { name: '24/7 Security & CCTV', code: 'SECURITY_CCTV', category: 'SECURITY', icon: 'shield' },
    {
      name: 'Continuous Water Supply (Bore)',
      code: 'WATER_BORE',
      category: 'UTILITIES',
      icon: 'water_drop',
    },
    {
      name: 'Furnished (Bed, Wardrobe, Desk)',
      code: 'FURNISHED',
      category: 'FURNISHING',
      icon: 'bed',
    },
    {
      name: 'Separate Kitchen with Gas Line',
      code: 'KITCHEN_GAS',
      category: 'FACILITIES',
      icon: 'kitchen',
    },
    {
      name: 'Air Conditioning / Geyser',
      code: 'CLIMATE_CONTROL',
      category: 'COMFORT',
      icon: 'ac_unit',
    },
    {
      name: 'Solar Energy Inverter',
      code: 'SOLAR_POWER',
      category: 'UTILITIES',
      icon: 'solar_power',
    },
  ];

  for (const amenity of amenitiesData) {
    await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: { name: amenity.name, category: amenity.category, icon: amenity.icon },
      create: amenity,
    });
  }
  console.log(`✅ ${amenitiesData.length} amenities seeded.`);

  // 5. Initial 15 Verified Localities in Peshawar
  for (const loc of PESHAWAR_LOCALITIES_CONFIG) {
    await prisma.locality.upsert({
      where: { slug: loc.slug },
      update: {
        name: loc.name,
        postalCode: loc.postalCode,
        latitude: loc.centerCoordinates.latitude,
        longitude: loc.centerCoordinates.longitude,
        boundaryGeoJson: {
          type: 'Polygon',
          coordinates: [PESHAWAR_SERVICE_BOUNDARY_POLYGON],
        },
        isActive: true,
      },
      create: {
        name: loc.name,
        slug: loc.slug,
        postalCode: loc.postalCode,
        latitude: loc.centerCoordinates.latitude,
        longitude: loc.centerCoordinates.longitude,
        boundaryGeoJson: {
          type: 'Polygon',
          coordinates: [PESHAWAR_SERVICE_BOUNDARY_POLYGON],
        },
        isActive: true,
      },
    });
  }
  console.log(`✅ ${PESHAWAR_LOCALITIES_CONFIG.length} Peshawar localities seeded.`);

  console.log('🎉 Seeding successfully completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
