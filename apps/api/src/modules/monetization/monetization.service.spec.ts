import { Test, TestingModule } from '@nestjs/testing';
import { MonetizationService } from './monetization.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('MonetizationService (Phase 10 Monetization & Compliance)', () => {
  let service: MonetizationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      property: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
      },
      locality: {
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MonetizationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MonetizationService>(MonetizationService);
  });

  describe('applyFeaturedPlacement', () => {
    it('successfully upgrades property to featured placement', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        landlordId: 'll-1',
      });
      mockPrisma.property.update.mockResolvedValue({
        id: 'prop-1',
        isFeatured: true,
      });

      const res = await service.applyFeaturedPlacement('ll-1', {
        propertyId: 'prop-1',
        durationDays: 14,
      });

      expect(res.isFeatured).toBe(true);
      expect(res.durationDays).toBe(14);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { isFeatured: true },
      });
    });

    it('forbids landlord from promoting another landlords property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        landlordId: 'other-landlord',
      });

      await expect(
        service.applyFeaturedPlacement('ll-1', { propertyId: 'prop-1', durationDays: 7 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMonetizationStatus', () => {
    it('returns pilot features and confirms Pakistani payment gateway compliance', async () => {
      const res = await service.getMonetizationStatus('ll-1');
      expect(res.tier).toBe('PILOT_PRO_TIER');
      expect(res.paymentGatewayCompliance.status).toBe('PILOT_MODE');
      expect(res.paymentGatewayCompliance.note).toContain('State Bank of Pakistan');
    });
  });
});
