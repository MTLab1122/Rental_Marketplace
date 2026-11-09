import { Test, TestingModule } from '@nestjs/testing';
import { LocalityService } from './locality.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('LocalityService', () => {
  let service: LocalityService;

  const mockLocality = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'University Town',
    slug: 'university-town',
    description: 'Premier student and residential locality',
    postalCode: '25120',
    latitude: 33.9982,
    longitude: 71.4883,
    boundaryGeoJson: null,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _count: { properties: 5 },
  };

  const mockPrismaService = {
    locality: {
      findMany: jest.fn().mockResolvedValue([mockLocality]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalityService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<LocalityService>(LocalityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllActive', () => {
    it('returns list of active localities', async () => {
      const result = await service.findAllActive();
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('University Town');
      expect(mockPrismaService.locality.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        select: expect.any(Object),
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('findByIdOrSlug', () => {
    it('finds locality by slug', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);
      const result = await service.findByIdOrSlug('university-town');
      expect(result.slug).toBe('university-town');
    });

    it('throws NotFoundException when locality does not exist', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(null);
      await expect(service.findByIdOrSlug('unknown-locality')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a new locality and logs audit event', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(null);
      mockPrismaService.locality.create.mockResolvedValue(mockLocality);

      const result = await service.create(
        {
          name: 'University Town',
          description: 'Premier student and residential locality',
          postalCode: '25120',
          latitude: 33.9982,
          longitude: 71.4883,
          isActive: true,
        },
        'admin-uuid-1',
      );

      expect(result.name).toBe('University Town');
      expect(mockPrismaService.locality.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'locality:create',
          actorId: 'admin-uuid-1',
        }),
      );
    });

    it('throws ConflictException on duplicate name', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);

      await expect(
        service.create(
          {
            name: 'University Town',
            postalCode: '25120',
            latitude: 33.9982,
            longitude: 71.4883,
          },
          'admin-uuid-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('deactivates an active locality', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);
      mockPrismaService.locality.update.mockResolvedValue({
        ...mockLocality,
        isActive: false,
      });

      const result = await service.updateStatus(mockLocality.id, false, 'admin-uuid-1');

      expect(result.isActive).toBe(false);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'locality:deactivate',
        }),
      );
    });
  });

  describe('delete', () => {
    it('soft deletes the locality by setting deletedAt and isActive=false', async () => {
      mockPrismaService.locality.findFirst.mockResolvedValue(mockLocality);
      mockPrismaService.locality.update.mockResolvedValue({
        ...mockLocality,
        isActive: false,
        deletedAt: new Date(),
      });

      const result = await service.delete(mockLocality.id, 'admin-uuid-1');
      expect(result.success).toBe(true);
      expect(mockPrismaService.locality.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
