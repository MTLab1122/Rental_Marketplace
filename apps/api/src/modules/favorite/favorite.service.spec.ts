import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteService } from './favorite.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { PropertyStatus, PropertyEligibility, TenantType } from '@rental-peshawar/shared-types';
import { NotFoundException } from '@nestjs/common';

describe('FavoriteService', () => {
  let service: FavoriteService;

  const userId = '11111111-1111-1111-1111-111111111111';
  const propertyId = '22222222-2222-2222-2222-222222222222';

  const mockStudentProperty = {
    id: propertyId,
    title: 'University Town Studio',
    status: PropertyStatus.APPROVED,
    eligibility: PropertyEligibility.STUDENTS_ONLY,
    deletedAt: null,
    favoriteCount: 3,
  };

  const mockFamilyProperty = {
    id: propertyId,
    title: 'Hayatabad Family House',
    status: PropertyStatus.APPROVED,
    eligibility: PropertyEligibility.FAMILIES_ONLY,
    deletedAt: null,
    favoriteCount: 5,
  };

  const mockPrismaService = {
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    favorite: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
  });

  describe('addFavorite', () => {
    it('throws NotFoundException if property does not exist or is not approved', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.addFavorite(userId, propertyId)).rejects.toThrow(NotFoundException);
    });

    it('enforces segregation: Student tenant cannot favorite FAMILIES_ONLY property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockFamilyProperty);

      await expect(
        service.addFavorite(userId, propertyId, { tenantType: TenantType.STUDENT }),
      ).rejects.toThrow(NotFoundException);
    });

    it('enforces segregation: Family tenant cannot favorite STUDENTS_ONLY property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockStudentProperty);

      await expect(
        service.addFavorite(userId, propertyId, { tenantType: TenantType.FAMILY }),
      ).rejects.toThrow(NotFoundException);
    });

    it('successfully favorites valid property, writes audit log and increments favoriteCount', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockStudentProperty);
      mockPrismaService.favorite.findUnique.mockResolvedValue(null);
      mockPrismaService.favorite.create.mockResolvedValue({
        id: 'fav-1',
        userId,
        propertyId,
      });

      const res = await service.addFavorite(userId, propertyId, {
        tenantType: TenantType.STUDENT,
      });

      expect(res.isFavorite).toBe(true);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'favorite:add', targetId: propertyId }),
      );
    });
  });

  describe('removeFavorite', () => {
    it('removes favorite and decrements favoriteCount', async () => {
      mockPrismaService.favorite.findUnique.mockResolvedValue({
        id: 'fav-1',
        userId,
        propertyId,
      });
      mockPrismaService.favorite.delete.mockResolvedValue({ id: 'fav-1' });

      const res = await service.removeFavorite(userId, propertyId);
      expect(res.success).toBe(true);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'favorite:remove', targetId: propertyId }),
      );
    });
  });

  describe('getUserFavoriteIds', () => {
    it('returns list of property IDs', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([
        { propertyId: 'prop-1' },
        { propertyId: 'prop-2' },
      ]);

      const res = await service.getUserFavoriteIds(userId);
      expect(res).toEqual(['prop-1', 'prop-2']);
    });
  });
});
