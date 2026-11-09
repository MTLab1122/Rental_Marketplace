import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from './property.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import {
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
  TenantType,
  ErrorCode,
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
      update: jest.fn(),
    },
    propertyImage: {
      count: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
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
    it('submitting for review fails when listing has 0 images', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
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

    it('submitting for review succeeds when listing has at least 1 image', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
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
});
