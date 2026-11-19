import { Test, TestingModule } from '@nestjs/testing';
import {
  MarketingAutomationService,
  MarketingChannel,
  MessageCategory,
} from './marketing-automation.service';
import { PrismaService } from '../../database/prisma.service';

describe('MarketingAutomationService', () => {
  let service: MarketingAutomationService;

  const mockPrisma = {
    auditLog: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    inquiry: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketingAutomationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MarketingAutomationService>(MarketingAutomationService);
  });

  describe('PKT Quiet Hours Handling', () => {
    it('detects 23:00 PKT (18:00 UTC) as quiet hours', () => {
      const date = new Date('2026-11-19T18:00:00.000Z');
      expect(service.isQuietHours(date)).toBe(true);
    });

    it('detects 06:00 PKT (01:00 UTC) as quiet hours', () => {
      const date = new Date('2026-11-19T01:00:00.000Z');
      expect(service.isQuietHours(date)).toBe(true);
    });

    it('detects 14:00 PKT (09:00 UTC) as active marketing hours', () => {
      const date = new Date('2026-11-19T09:00:00.000Z');
      expect(service.isQuietHours(date)).toBe(false);
    });
  });

  describe('Opt-Out & Frequency Capping', () => {
    it('blocks promotional messages when user has opted out', async () => {
      mockPrisma.auditLog.findFirst
        .mockResolvedValueOnce({
          id: 'opt-out-1',
          actorId: 'user-1',
          action: 'MARKETING_OPT_OUT',
          createdAt: new Date('2026-11-18T10:00:00.000Z'),
        })
        .mockResolvedValueOnce(null); // No subsequent opt-in

      const result = await service.dispatchMessage({
        userId: 'user-1',
        channel: MarketingChannel.EMAIL,
        category: MessageCategory.PROMOTIONAL,
        title: 'Weekend Deal',
        body: 'Check out new rentals',
      });

      expect(result.status).toBe('BLOCKED');
      expect(result.reason).toBe('USER_OPTED_OUT');
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('blocks promotional messages when daily frequency cap of 2 is exceeded', async () => {
      jest.spyOn(service, 'isQuietHours').mockReturnValue(false);
      mockPrisma.auditLog.findFirst.mockResolvedValue(null); // Not opted out
      mockPrisma.auditLog.count.mockResolvedValue(2); // Already reached 2

      const result = await service.dispatchMessage({
        userId: 'user-1',
        channel: MarketingChannel.PUSH,
        category: MessageCategory.PROMOTIONAL,
        title: 'Special Offer',
        body: 'Rent discount available',
      });

      expect(result.status).toBe('BLOCKED');
      expect(result.reason).toBe('FREQUENCY_CAP_EXCEEDED');
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('queues promotional message during quiet hours', async () => {
      jest.spyOn(service, 'isQuietHours').mockReturnValue(true);
      mockPrisma.auditLog.findFirst.mockResolvedValue(null); // Not opted out

      const result = await service.dispatchMessage({
        userId: 'user-1',
        channel: MarketingChannel.WHATSAPP,
        category: MessageCategory.PROMOTIONAL,
        title: 'Listing Update',
        body: 'New match available',
      });

      expect(result.status).toBe('QUEUED');
      expect(result.reason).toBe('QUIET_HOURS_ACTIVE');
    });

    it('allows transactional messages even during quiet hours and bypassing frequency cap', async () => {
      jest.spyOn(service, 'isQuietHours').mockReturnValue(true);
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.dispatchMessage({
        userId: 'user-1',
        channel: MarketingChannel.SMS,
        category: MessageCategory.TRANSACTIONAL,
        title: 'Security Verification Code',
        body: 'Your code is 123456',
      });

      expect(result.status).toBe('SENT');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Lifecycle Journeys', () => {
    it('triggers personalized welcome sequence for a landlord', async () => {
      jest.spyOn(service, 'isQuietHours').mockReturnValue(false);
      mockPrisma.auditLog.findFirst.mockResolvedValue(null);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'landlord-1',
        email: 'landlord@test.pk',
        phoneNumber: '03001234567',
        landlordProfile: { id: 'lp-1' },
      });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.triggerWelcomeSequence('landlord-1');

      expect(result.status).toBe('SENT');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('Landlords'),
          }),
        }),
      );
    });

    it('triggers personalized welcome sequence for a tenant', async () => {
      jest.spyOn(service, 'isQuietHours').mockReturnValue(false);
      mockPrisma.auditLog.findFirst.mockResolvedValue(null);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'tenant-1',
        email: 'tenant@test.pk',
        phoneNumber: '03009876543',
        tenantProfile: { id: 'tp-1' },
      });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-2' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-2' });

      const result = await service.triggerWelcomeSequence('tenant-1');

      expect(result.status).toBe('SENT');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('Find Your Next Home'),
          }),
        }),
      );
    });

    it('triggers saved search digest to tenant with matched count', async () => {
      jest.spyOn(service, 'isQuietHours').mockReturnValue(false);
      mockPrisma.auditLog.findFirst.mockResolvedValue(null);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'tenant-1',
        email: 'tenant@test.pk',
      });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-3' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-3' });

      const result = await service.triggerSavedSearchDigest(
        'tenant-1',
        'saved-search-123',
        5,
        'Hayatabad Phase 3',
      );

      expect(result.status).toBe('SENT');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: '5 new verified rentals in Hayatabad Phase 3',
          }),
        }),
      );
    });
  });
});
