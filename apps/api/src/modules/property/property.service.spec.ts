import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from './property.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
  TenantType,
  ErrorCode,
  ViewSource,
} from '@rental-peshawar/shared-types';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PropertyService', () => {
  let service: PropertyService;

  const landlordId = '11111111-1111-1111-1111-111111111111';
  const otherLandlordId = '22222222-2222-2222-2222-222222222222';
  const localityId = '33333333-3333-3333-3333-333333333333';
  const propertyId = '44444444-4444-4444-4444-444444444444';

  const mockLocality = {
    id: localityId,
    name: 'University Town',
    slug: 'university-town',
    isActive: true,
    deletedAt: null,
    boundaryGeoJson: null,
  };

  const mockProperty = {
    id: propertyId,
    landlordId,
    localityId,
    title: 'University Town Student Studio',
    slug: 'university-town-student-studio-abc123',
    description: 'Clean studio room for University of Peshawar students.',
    eligibility: PropertyEligibility.STUDENTS_ONLY,
    propertyType: PropertyType.SINGLE_ROOM,
    status: PropertyStatus.DRAFT,
    monthlyRentPkr: new Prisma.Decimal(15000),
    securityDepositPkr: new Prisma.Decimal(30000),
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: new Prisma.Decimal(350),
    furnishing: 'FURNISHED',
    address: 'Street 4, Sector B, University Town',
    addressNote: 'Near UOP Main Gate',
    latitude: new Prisma.Decimal(33.9982),
    longitude: new Prisma.Decimal(71.4883),
    isAvailable: true,
    isFeatured: false,
    viewCount: 10,
    inquiryCount: 2,
    favoriteCount: 5,
    createdAt: new Date('2026-02-15T10:00:00Z'),
    updatedAt: new Date('2026-02-15T10:00:00Z'),
    deletedAt: null,
    locality: mockLocality,
    images: [{ id: 'img-1', url: 'https://cdn.example.com/p1.jpg', isPrimary: true, sortOrder: 0 }],
    amenities: [{ amenity: { id: 'am-1', name: 'High-Speed Internet', code: 'HIGH_SPEED_WIFI' } }],
  };

  const mockPrismaService = {
    locality: {
      findFirst: jest.fn(),
    },
    property: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    propertyImage: {
      count: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    propertyViewEvent: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    favorite: {
      count: jest.fn(),
    },
    inquiry: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: landlordId,
      isVerified: true,
      landlordProfile: { isCnicVerified: true },
    });
    mockPrismaService.property.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('successfully creates a valid Peshawar property listing', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);
      mockPrismaService.property.create.mockResolvedValue(mockProperty);

      const result = await service.create(landlordId, {
        title: 'University Town Student Studio',
        description: 'Clean studio room for University of Peshawar students.',
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        propertyType: PropertyType.SINGLE_ROOM,
        monthlyRentPkr: 15000,
        securityDepositPkr: 30000,
        bedrooms: 1,
        bathrooms: 1,
        address: 'Street 4, Sector B, University Town',
        latitude: 33.9982,
        longitude: 71.4883,
        localityId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(propertyId);
      expect(mockPrismaService.property.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property:create', actorId: landlordId }),
      );
    });

    it('rejects coordinates outside Peshawar boundary with 422 LOCATION_OUTSIDE_PESHAWAR', async () => {
      await expect(
        service.create(landlordId, {
          title: 'Islamabad Luxury Apartment',
          description: 'This is in Islamabad, not Peshawar.',
          eligibility: PropertyEligibility.FAMILIES_ONLY,
          propertyType: PropertyType.APARTMENT,
          monthlyRentPkr: 60000,
          securityDepositPkr: 120000,
          bedrooms: 3,
          bathrooms: 2,
          address: 'F-10 Markaz, Islamabad',
          latitude: 33.6844,
          longitude: 73.0479, // Outside Peshawar boundary
          localityId,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.LOCATION_OUTSIDE_PESHAWAR,
          }),
        }),
      );
    });

    it('rejects invalid eligibility and property type combination with 422', async () => {
      // STUDENTS_ONLY cannot be a HOUSE
      await expect(
        service.create(landlordId, {
          title: 'Full Student House',
          description: 'Full house listing for students.',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.HOUSE,
          monthlyRentPkr: 80000,
          securityDepositPkr: 160000,
          bedrooms: 4,
          bathrooms: 3,
          address: 'Street 1, Hayatabad',
          latitude: 33.9875,
          longitude: 71.4332,
          localityId,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.INVALID_ELIGIBILITY_PROPERTY_TYPE,
          }),
        }),
      );
    });

    it('rejects property creation when landlord is not identity verified with LANDLORD_NOT_VERIFIED', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: landlordId,
        isVerified: false,
        landlordProfile: { isCnicVerified: false },
      });

      await expect(
        service.create(landlordId, {
          title: 'University Town Student Studio',
          description: 'Clean studio room.',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.SINGLE_ROOM,
          monthlyRentPkr: 15000,
          securityDepositPkr: 30000,
          bedrooms: 1,
          bathrooms: 1,
          address: 'Street 4, Sector B',
          latitude: 33.9982,
          longitude: 71.4883,
          localityId,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.LANDLORD_NOT_VERIFIED,
          }),
        }),
      );
    });

    it('rejects near-duplicate listing if allowDuplicateBypass is false with DUPLICATE_LISTING_EXISTS', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);
      mockPrismaService.property.findMany.mockResolvedValue([
        {
          id: 'existing-dup-1',
          landlordId,
          localityId,
          propertyType: PropertyType.SINGLE_ROOM,
          title: 'University Town Student Studio',
          monthlyRentPkr: new Prisma.Decimal(15000),
          latitude: new Prisma.Decimal(33.9982),
          longitude: new Prisma.Decimal(71.4883),
        },
      ]);

      await expect(
        service.create(landlordId, {
          title: 'University Town Student Studio',
          description: 'Near duplicate studio listing.',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.SINGLE_ROOM,
          monthlyRentPkr: 15000,
          securityDepositPkr: 30000,
          bedrooms: 1,
          bathrooms: 1,
          address: 'Street 4, Sector B',
          latitude: 33.9982,
          longitude: 71.4883,
          localityId,
          allowDuplicateBypass: false,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.DUPLICATE_LISTING_EXISTS,
          }),
        }),
      );
    });

    it('creates listing with warning if allowDuplicateBypass is true', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);
      mockPrismaService.property.findMany.mockResolvedValue([
        {
          id: 'existing-dup-1',
          landlordId,
          localityId,
          propertyType: PropertyType.SINGLE_ROOM,
          title: 'University Town Student Studio',
          monthlyRentPkr: new Prisma.Decimal(15000),
          latitude: new Prisma.Decimal(33.9982),
          longitude: new Prisma.Decimal(71.4883),
        },
      ]);
      mockPrismaService.property.create.mockResolvedValue({
        ...mockProperty,
        isDuplicateWarning: true,
        duplicateOfPropertyId: 'existing-dup-1',
      });

      const res = await service.create(landlordId, {
        title: 'University Town Student Studio',
        description: 'Bypassing duplicate warning with confirmed flag.',
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        propertyType: PropertyType.SINGLE_ROOM,
        monthlyRentPkr: 15000,
        securityDepositPkr: 30000,
        bedrooms: 1,
        bathrooms: 1,
        address: 'Street 4, Sector B',
        latitude: 33.9982,
        longitude: 71.4883,
        localityId,
        allowDuplicateBypass: true,
      });

      expect(res.isDuplicateWarning).toBe(true);
      expect(mockPrismaService.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDuplicateWarning: true,
            duplicateOfPropertyId: 'existing-dup-1',
          }),
        }),
      );
    });

    it('rejects property creation when locality is inactive with LOCALITY_INACTIVE', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue({
        ...mockLocality,
        isActive: false,
      });

      await expect(
        service.create(landlordId, {
          title: 'Student Studio',
          description: 'Clean studio room.',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.SINGLE_ROOM,
          monthlyRentPkr: 15000,
          securityDepositPkr: 30000,
          bedrooms: 1,
          bathrooms: 1,
          address: 'Street 4, Sector B',
          latitude: 33.9982,
          longitude: 71.4883,
          localityId,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.LOCALITY_INACTIVE,
          }),
        }),
      );
    });
  });

  describe('findByIdForLandlord / update / delete ownership protection', () => {
    it('throws ForbiddenException when landlord tries to view another landlord property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        landlordId: otherLandlordId,
      });

      await expect(service.findByIdForLandlord(propertyId, landlordId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when landlord tries to update another landlord property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        landlordId: otherLandlordId,
      });

      await expect(
        service.update(propertyId, landlordId, { title: 'Hacked Title' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft deletes the property and marks as unavailable and DELETED', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.DELETED,
        isAvailable: false,
        deletedAt: new Date(),
      });

      const res = await service.delete(propertyId, landlordId);
      expect(res.success).toBe(true);
      expect(mockPrismaService.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PropertyStatus.DELETED,
            isAvailable: false,
          }),
        }),
      );
    });
  });

  describe('updateStatusByLandlord workflow', () => {
    it('submitting for review fails when landlord is not identity verified', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: landlordId,
        isVerified: false,
        landlordProfile: { isCnicVerified: false },
      });

      await expect(
        service.updateStatusByLandlord(propertyId, landlordId, PropertyStatus.PENDING_REVIEW),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.LANDLORD_NOT_VERIFIED,
          }),
        }),
      );
    });

    it('submitting for review fails when listing has 0 images', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: landlordId,
        isVerified: true,
        landlordProfile: { isCnicVerified: true },
      });
      mockPrismaService.propertyImage.count.mockResolvedValue(0);

      await expect(
        service.updateStatusByLandlord(propertyId, landlordId, PropertyStatus.PENDING_REVIEW),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.IMAGE_REQUIRED_FOR_REVIEW,
          }),
        }),
      );
    });

    it('submitting for review succeeds when listing has at least 1 image and landlord is verified', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: landlordId,
        isVerified: true,
        landlordProfile: { isCnicVerified: true },
      });
      mockPrismaService.propertyImage.count.mockResolvedValue(2);
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.PENDING_REVIEW,
      });

      const result = await service.updateStatusByLandlord(
        propertyId,
        landlordId,
        PropertyStatus.PENDING_REVIEW,
      );

      expect(result.status).toBe(PropertyStatus.PENDING_REVIEW);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property:submit_review' }),
      );
    });

    it('landlord marks property as RENTED', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.RENTED,
        isAvailable: false,
      });

      const result = await service.updateStatusByLandlord(
        propertyId,
        landlordId,
        PropertyStatus.RENTED,
      );

      expect(result.status).toBe(PropertyStatus.RENTED);
      expect(result.isAvailable).toBe(false);
    });

    it('landlord can restore UNAVAILABLE to available only if property was APPROVED', async () => {
      // Trying to restore when status is DRAFT fails
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.DRAFT,
      });

      await expect(
        service.updateStatusByLandlord(propertyId, landlordId, PropertyStatus.APPROVED),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.INVALID_STATUS_TRANSITION,
          }),
        }),
      );
    });

    it('prevents landlord from making REJECTED listing available with CANNOT_ACTIVATE_REJECTED_PROPERTY', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.REJECTED,
      });

      await expect(
        service.updateStatusByLandlord(propertyId, landlordId, PropertyStatus.APPROVED),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.CANNOT_ACTIVATE_REJECTED_PROPERTY,
          }),
        }),
      );
    });

    it('prevents landlord from making SUSPENDED listing available with CANNOT_ACTIVATE_REJECTED_PROPERTY', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.SUSPENDED,
      });

      await expect(
        service.updateStatusByLandlord(propertyId, landlordId, PropertyStatus.APPROVED),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.CANNOT_ACTIVATE_REJECTED_PROPERTY,
          }),
        }),
      );
    });

    it('landlord restores RENTED listing to available when previously approved', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.RENTED,
        isAvailable: false,
      });
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
      });

      const res = await service.updateStatusByLandlord(
        propertyId,
        landlordId,
        PropertyStatus.APPROVED,
      );

      expect(res.status).toBe(PropertyStatus.APPROVED);
      expect(res.isAvailable).toBe(true);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property:restore_available' }),
      );
    });
  });

  describe('updateStatusByAdmin moderation', () => {
    it('admin approves listing', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.PENDING_REVIEW,
      });
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
      });

      const res = await service.updateStatusByAdmin(propertyId, 'admin-1', {
        status: PropertyStatus.APPROVED,
      });

      expect(res.status).toBe(PropertyStatus.APPROVED);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property:admin_approved' }),
      );
    });

    it('admin rejects listing with reason', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.PENDING_REVIEW,
      });
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.REJECTED,
        isAvailable: false,
        rejectionReason: 'Invalid student hostel registration documents',
      });

      const res = await service.updateStatusByAdmin(propertyId, 'admin-1', {
        status: PropertyStatus.REJECTED,
        reason: 'Invalid student hostel registration documents',
      });

      expect(res.status).toBe(PropertyStatus.REJECTED);
      expect(mockPrismaService.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PropertyStatus.REJECTED,
            rejectionReason: 'Invalid student hostel registration documents',
          }),
        }),
      );
    });

    it('admin suspends active listing with reason', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.APPROVED,
      });
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.SUSPENDED,
        isAvailable: false,
      });

      const res = await service.updateStatusByAdmin(propertyId, 'admin-1', {
        status: PropertyStatus.SUSPENDED,
        reason: 'Reported scam listing under investigation',
      });

      expect(res.status).toBe(PropertyStatus.SUSPENDED);
    });
  });

  describe('dedicated admin moderation actions', () => {
    it('approveByAdmin approves listing, notifies landlord, and writes audit log', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        locality: { ...mockLocality, isActive: true },
        images: [{ id: 'img-1', moderationStatus: 'APPROVED' }],
      });
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
      });

      const res = await service.approveByAdmin(propertyId, 'admin-1');
      expect(res.status).toBe(PropertyStatus.APPROVED);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        landlordId,
        'LISTING_APPROVED',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ propertyId }),
      );
    });

    it('rejectByAdmin rejects listing and notifies landlord', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.REJECTED,
      });

      const res = await service.rejectByAdmin(propertyId, 'admin-1', 'Violation of terms');
      expect(res.status).toBe(PropertyStatus.REJECTED);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        landlordId,
        'LISTING_REJECTED',
        expect.any(String),
        expect.stringContaining('Violation of terms'),
        expect.objectContaining({ propertyId }),
      );
    });

    it('suspendByAdmin suspends listing and notifies landlord', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.SUSPENDED,
      });

      const res = await service.suspendByAdmin(propertyId, 'admin-1', 'Fraud investigation');
      expect(res.status).toBe(PropertyStatus.SUSPENDED);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        landlordId,
        'LISTING_SUSPENDED',
        expect.any(String),
        expect.stringContaining('Fraud investigation'),
        expect.objectContaining({ propertyId }),
      );
    });
  });

  describe('Public search & discovery strict segregation', () => {
    it('enforces STUDENTS_ONLY when user is a STUDENT tenant', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([mockProperty]);

      await service.searchPublic(
        {},
        { sub: 'tenant-1', tenantType: TenantType.STUDENT, roles: ['TENANT'] },
      );

      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eligibility: PropertyEligibility.STUDENTS_ONLY,
            status: PropertyStatus.APPROVED,
            isAvailable: true,
            deletedAt: null,
          }),
        }),
      );
    });

    it('enforces FAMILIES_ONLY when user is a FAMILY tenant', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);

      await service.searchPublic(
        {},
        { sub: 'tenant-2', tenantType: TenantType.FAMILY, roles: ['TENANT'] },
      );

      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eligibility: PropertyEligibility.FAMILIES_ONLY,
            status: PropertyStatus.APPROVED,
            isAvailable: true,
            deletedAt: null,
          }),
        }),
      );
    });

    it('public search filters exclude inactive locality, rented, and unavailable listings', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);

      await service.searchPublic({
        minRent: 10000,
        maxRent: 30000,
        minBedrooms: 1,
      });

      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PropertyStatus.APPROVED,
            isAvailable: true,
            deletedAt: null,
            locality: expect.objectContaining({ isActive: true, deletedAt: null }),
            monthlyRentPkr: expect.objectContaining({
              gte: expect.any(Prisma.Decimal),
              lte: expect.any(Prisma.Decimal),
            }),
            bedrooms: expect.objectContaining({ gte: 1 }),
          }),
        }),
      );
    });

    it('public search returns masked data without landlord phone, email, or exact address', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([mockProperty]);

      const res = await service.searchPublic({});
      expect(res.items).toHaveLength(1);
      const item = res.items[0]!;
      expect(item.title).toBe(mockProperty.title);
      expect((item as Record<string, unknown>)['address']).toBeUndefined();
      expect((item as Record<string, unknown>)['landlord']).toBeUndefined();
      expect(item.addressNote).toBe('Near UOP Main Gate');
    });

    it('findPublicById throws NotFoundException if student accesses FAMILIES_ONLY property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        eligibility: PropertyEligibility.FAMILIES_ONLY,
      });

      await expect(
        service.findPublicById(propertyId, {
          sub: 'student-1',
          tenantType: TenantType.STUDENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('findPublicById throws NotFoundException if family accesses STUDENTS_ONLY property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        eligibility: PropertyEligibility.STUDENTS_ONLY,
      });

      await expect(
        service.findPublicById(propertyId, {
          sub: 'family-1',
          tenantType: TenantType.FAMILY,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('findPublicById allows landlord owner to view their unapproved draft property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        status: PropertyStatus.DRAFT,
        isAvailable: false,
      });

      const res = await service.findPublicById(propertyId, {
        sub: landlordId,
      });

      expect(res.id).toBe(propertyId);
      expect(res.address).toBe(mockProperty.address); // exact address shown to owner
    });
  });

  describe('recordView analytics tracking', () => {
    it('records view event with hashed IP and increments property viewCount', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        id: propertyId,
        localityId,
        deletedAt: null,
      });
      mockPrismaService.propertyViewEvent.create.mockResolvedValue({ id: 'pve-1' });
      mockPrismaService.property.update.mockResolvedValue(mockProperty);

      const res = await service.recordView(
        propertyId,
        { source: ViewSource.WEB, localityId },
        'viewer-1',
        '192.168.1.1',
      );

      expect(res.success).toBe(true);
      expect(mockPrismaService.propertyViewEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyId,
            viewerId: 'viewer-1',
            source: ViewSource.WEB,
            localityId,
          }),
        }),
      );
      expect(mockPrismaService.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: propertyId },
          data: { viewCount: { increment: 1 } },
        }),
      );
    });
  });

  describe('getPropertyAnalytics', () => {
    it('calculates real listing analytics accurately from database events', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({
        ...mockProperty,
        title: 'Spacious University Town Student Apartment with Study Desks',
        description:
          'Fully equipped student apartment with high speed internet, dedicated study desks, backup generator, and walking distance to University of Peshawar.',
      });
      mockPrismaService.propertyViewEvent.count.mockResolvedValue(45);
      mockPrismaService.propertyViewEvent.findMany
        .mockResolvedValueOnce([{ viewerId: 'user-1' }, { viewerId: 'user-2' }]) // distinct users
        .mockResolvedValueOnce([{ ipHash: 'hash-1' }, { ipHash: 'hash-2' }, { ipHash: 'hash-3' }]); // distinct IPs
      mockPrismaService.favorite.count.mockResolvedValue(12);

      const inqCreatedAt = new Date('2026-02-15T10:00:00Z');
      mockPrismaService.inquiry.findMany.mockResolvedValue([
        { id: 'inq-1', status: 'REPLIED', createdAt: inqCreatedAt, conversation: { id: 'conv-1' } },
        { id: 'inq-2', status: 'SUBMITTED', createdAt: inqCreatedAt, conversation: null },
      ]);

      mockPrismaService.message.findFirst.mockResolvedValue({
        createdAt: new Date('2026-02-15T10:30:00Z'), // 30 minutes later
      });

      mockPrismaService.propertyViewEvent.groupBy
        .mockResolvedValueOnce([
          { source: ViewSource.WEB, _count: { id: 30 } },
          { source: ViewSource.MOBILE, _count: { id: 15 } },
        ])
        .mockResolvedValueOnce([
          { localityId: 'loc-1', _count: { id: 25 } },
          { localityId: 'loc-2', _count: { id: 20 } },
        ]);

      const analytics = await service.getPropertyAnalytics(propertyId, landlordId);

      expect(analytics.propertyId).toBe(propertyId);
      expect(analytics.totalViews).toBe(45);
      expect(analytics.uniqueViews).toBe(5); // 2 users + 3 ips
      expect(analytics.favoritesCount).toBe(12);
      expect(analytics.inquiriesCount).toBe(2);
      expect(analytics.responseRatePercent).toBe(50); // 1 out of 2 responded
      expect(analytics.averageResponseTimeMinutes).toBe(30); // 30 min diff
      expect(analytics.qualityScore).toBeGreaterThanOrEqual(50);
      expect(analytics.viewsBySource.web).toBe(30);
      expect(analytics.viewsBySource.mobile).toBe(15);
      expect(analytics.viewsByLocality['loc-1']).toBe(25);
    });
  });

  describe('getLandlordDashboard', () => {
    it('aggregates real metrics and recent inquiries for landlord dashboard', async () => {
      mockPrismaService.property.count
        .mockResolvedValueOnce(5) // totalProperties
        .mockResolvedValueOnce(3) // activeListings
        .mockResolvedValueOnce(1) // pendingReview
        .mockResolvedValueOnce(1) // rentedCount
        .mockResolvedValueOnce(0); // unavailableCount

      mockPrismaService.property.findMany.mockResolvedValue([{ id: propertyId }]);
      mockPrismaService.inquiry.count
        .mockResolvedValueOnce(10) // totalInquiries
        .mockResolvedValueOnce(2); // unreadInquiries

      mockPrismaService.message.count.mockResolvedValue(4); // unreadMessagesCount
      mockPrismaService.propertyViewEvent.count.mockResolvedValue(150); // totalViews

      mockPrismaService.inquiry.findMany
        .mockResolvedValueOnce([
          {
            id: 'inq-1',
            status: 'REPLIED',
            createdAt: new Date('2026-02-15T10:00:00Z'),
            conversation: { id: 'c1' },
          },
          {
            id: 'inq-2',
            status: 'SUBMITTED',
            createdAt: new Date('2026-02-15T11:00:00Z'),
            conversation: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'inq-1',
            propertyId,
            tenantId: 'tenant-1',
            landlordId,
            status: 'REPLIED',
            message: 'Is this studio available from March?',
            proposedRentPkr: new Prisma.Decimal(15000),
            proposedMoveInDate: new Date('2026-03-01'),
            preferredContactMethod: 'IN_APP',
            conversation: { id: 'c1' },
            createdAt: new Date('2026-02-15T10:00:00Z'),
            updatedAt: new Date('2026-02-15T10:30:00Z'),
            property: {
              id: propertyId,
              title: 'University Town Student Studio',
              slug: 'university-town-student-studio',
              monthlyRentPkr: new Prisma.Decimal(15000),
              locality: { id: localityId, name: 'University Town', slug: 'university-town' },
              images: [{ url: 'https://cdn.example.com/p1.jpg' }],
            },
            tenant: {
              id: 'tenant-1',
              fullName: 'Ahmad Khan',
              email: 'ahmad@example.com',
              phoneNumber: '+923001234567',
            },
          },
        ]);

      mockPrismaService.message.findFirst.mockResolvedValue({
        createdAt: new Date('2026-02-15T10:20:00Z'), // 20 min diff
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: landlordId,
        isVerified: true,
        landlordProfile: {
          cnicNumber: '1730112345671',
          isCnicVerified: true,
        },
      });

      const dashboard = await service.getLandlordDashboard(landlordId);

      expect(dashboard.totalProperties).toBe(5);
      expect(dashboard.activeListings).toBe(3);
      expect(dashboard.pendingReview).toBe(1);
      expect(dashboard.rentedCount).toBe(1);
      expect(dashboard.totalInquiries).toBe(10);
      expect(dashboard.unreadInquiries).toBe(2);
      expect(dashboard.unreadMessagesCount).toBe(4);
      expect(dashboard.totalViews).toBe(150);
      expect(dashboard.averageResponseTimeMinutes).toBe(20);
      expect(dashboard.responseRatePercent).toBe(50);
      expect(dashboard.recentInquiries.length).toBe(1);
      expect(dashboard.verification.isVerified).toBe(true);
      expect(dashboard.verification.cnicMasked).toBe('17301-*******-1');
    });
  });
});
