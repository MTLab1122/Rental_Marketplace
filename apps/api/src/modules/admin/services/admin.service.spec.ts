import { Test, TestingModule } from '@nestjs/testing';
import { MfaService } from './mfa.service';
import { AdminUserService } from './admin-user.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminSettingsService } from './admin-settings.service';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { UserRole } from '@rental-peshawar/shared-types';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('Admin Module Services Tests', () => {
  let mfaService: MfaService;
  let adminUserService: AdminUserService;
  let adminAnalyticsService: AdminAnalyticsService;
  let adminSettingsService: AdminSettingsService;

  const mockPrisma: any = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    userRole: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    tenantProfile: {
      count: jest.fn(),
    },
    landlordProfile: {
      count: jest.fn(),
    },
    property: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    inquiry: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
    report: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    propertyViewEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    locality: {
      findMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        AdminUserService,
        AdminAnalyticsService,
        AdminSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    mfaService = module.get<MfaService>(MfaService);
    adminUserService = module.get<AdminUserService>(AdminUserService);
    adminAnalyticsService = module.get<AdminAnalyticsService>(AdminAnalyticsService);
    adminSettingsService = module.get<AdminSettingsService>(AdminSettingsService);
  });

  describe('MfaService (TOTP RFC 6238)', () => {
    it('generates a valid 32-character base32 secret and otpauth URI', () => {
      const secret = mfaService.generateSecret();
      expect(secret).toHaveLength(32);
      expect(secret).toMatch(/^[A-Z2-7]+$/);

      const uri = mfaService.generateOtpAuthUri('admin@peshawar.pk', secret);
      expect(uri).toContain('otpauth://totp/PeshawarRentals:admin%40peshawar.pk');
      expect(uri).toContain(`secret=${secret}`);
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });

    it('rejects invalid or malformed tokens', () => {
      const secret = mfaService.generateSecret();
      expect(mfaService.verifyToken(secret, '')).toBe(false);
      expect(mfaService.verifyToken(secret, '12345')).toBe(false);
      expect(mfaService.verifyToken(secret, 'abcdef')).toBe(false);
      expect(mfaService.verifyToken(secret, '1234567')).toBe(false);
    });
  });

  describe('AdminUserService', () => {
    it('findUsers returns formatted user items and pagination metadata', async () => {
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'landlord@peshawar.pk',
          fullName: 'Tariq Khan',
          phoneNumber: '03001234567',
          isVerified: true,
          isSuspended: false,
          roles: [{ role: { name: 'LANDLORD' } }],
          tenantProfile: null,
          landlordProfile: { cnicNumber: '17301-1234567-1' },
          _count: { properties: 3, inquiriesSent: 0, inquiriesReceived: 10 },
        },
      ]);

      const result = await adminUserService.findUsers({ page: 1, limit: 10 });
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.roles).toEqual(['LANDLORD']);
    });

    it('suspendUser suspends user and revokes all active refresh tokens with audit log', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'bad-user',
        isSuspended: false,
        roles: [{ role: { name: 'TENANT' } }],
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'bad-user',
        isSuspended: true,
        suspendedReason: 'Spam inquiries',
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await adminUserService.suspendUser('bad-user', 'admin-1', 'Spam inquiries');

      expect(result.isSuspended).toBe(true);
      expect(result.suspendedReason).toBe('Spam inquiries');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'bad-user', isRevoked: false },
        data: { isRevoked: true },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_SUSPENDED',
          targetId: 'bad-user',
          actorId: 'admin-1',
        }),
      );
    });

    it('blocks suspending a SUPER_ADMIN account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'super-admin-user',
        roles: [{ role: { name: 'SUPER_ADMIN' } }],
      });

      await expect(
        adminUserService.suspendUser('super-admin-user', 'admin-1', 'Test reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('updateUserRole allows SUPER_ADMIN to change user role and revokes tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-user',
        roles: [{ role: { name: 'MODERATOR' } }],
      });
      mockPrisma.role.findFirst.mockResolvedValue({
        id: 'role-admin-id',
        name: 'ADMIN',
      });

      const result = await adminUserService.updateUserRole(
        'target-user',
        UserRole.ADMIN,
        'super-admin-1',
        ['SUPER_ADMIN'],
      );

      expect(result.roles).toEqual([UserRole.ADMIN]);
      expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'target-user' },
      });
      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'target-user', roleId: 'role-admin-id' },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_CHANGED',
          actorId: 'super-admin-1',
        }),
      );
    });

    it('updateUserRole rejects non-SUPER_ADMIN with ForbiddenException', async () => {
      await expect(
        adminUserService.updateUserRole('target-user', UserRole.ADMIN, 'admin-1', ['ADMIN']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('AdminAnalyticsService', () => {
    it('getPlatformAnalytics aggregates database metrics across users, properties, and SLA', async () => {
      mockPrisma.user.count.mockResolvedValueOnce(150); // total
      mockPrisma.user.count.mockResolvedValueOnce(145); // active
      mockPrisma.user.count.mockResolvedValueOnce(5); // suspended
      mockPrisma.tenantProfile.count.mockResolvedValueOnce(100); // student
      mockPrisma.tenantProfile.count.mockResolvedValueOnce(20); // family
      mockPrisma.landlordProfile.count.mockResolvedValueOnce(30); // total landlords
      mockPrisma.landlordProfile.count.mockResolvedValueOnce(25); // verified landlords
      mockPrisma.property.groupBy.mockResolvedValueOnce([
        { status: 'APPROVED', _count: { id: 45 } },
        { status: 'PENDING_REVIEW', _count: { id: 5 } },
      ]);
      mockPrisma.property.groupBy.mockResolvedValueOnce([
        { eligibility: 'STUDENTS_ONLY', _count: { id: 35 } },
        { eligibility: 'FAMILIES_ONLY', _count: { id: 15 } },
      ]);
      mockPrisma.property.groupBy.mockResolvedValueOnce([
        { localityId: 'loc-1', _count: { id: 25 } },
      ]);
      mockPrisma.inquiry.count.mockResolvedValue(60);
      mockPrisma.inquiry.groupBy.mockResolvedValue([
        { status: 'ACCEPTED', _count: { id: 40 } },
        { status: 'PENDING', _count: { id: 20 } },
      ]);
      mockPrisma.message.count.mockResolvedValue(450);
      mockPrisma.report.count.mockResolvedValue(3);
      mockPrisma.report.groupBy.mockResolvedValueOnce([{ status: 'RESOLVED', _count: { id: 3 } }]);
      mockPrisma.report.groupBy.mockResolvedValueOnce([
        { reason: 'FAKE_LISTING', _count: { id: 3 } },
      ]);
      mockPrisma.propertyViewEvent.count.mockResolvedValue(1200);
      mockPrisma.locality.findMany.mockResolvedValue([{ id: 'loc-1', name: 'University Town' }]);
      mockPrisma.property.findMany.mockResolvedValue([
        {
          createdAt: new Date('2026-11-01T10:00:00Z'),
          verifiedAt: new Date('2026-11-01T12:00:00Z'),
        },
      ]);

      const data = await adminAnalyticsService.getPlatformAnalytics();

      expect(data.overview.totalUsers).toBe(150);
      expect(data.overview.activeUsers).toBe(145);
      expect(data.tenants.studentTenants).toBe(100);
      expect(data.properties.byStatus['APPROVED']).toBe(45);
      expect(data.properties.byEligibility['STUDENTS_ONLY']).toBe(35);
      expect(data.properties.byLocality['University Town']).toBe(25);
      expect(data.overview.avgModerationHours).toBe(2);
    });

    it('getTrends generates 30 daily buckets', async () => {
      mockPrisma.propertyViewEvent.findMany.mockResolvedValue([]);
      mockPrisma.inquiry.findMany.mockResolvedValue([]);
      mockPrisma.property.findMany.mockResolvedValue([]);

      const trends = await adminAnalyticsService.getTrends();
      expect(trends.daily).toHaveLength(30);
      expect(trends.daily[0]).toHaveProperty('date');
      expect(trends.daily[0]).toHaveProperty('views');
      expect(trends.daily[0]).toHaveProperty('inquiries');
      expect(trends.daily[0]).toHaveProperty('listings');
    });
  });

  describe('AdminSettingsService', () => {
    it('getSettings loads settings and ensures defaults', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      mockPrisma.systemSetting.create.mockResolvedValue({});
      mockPrisma.systemSetting.findMany.mockResolvedValue([
        { key: 'allow_landlord_registration', value: true, description: 'Desc' },
      ]);

      const settings = await adminSettingsService.getSettings();
      expect(settings).toHaveLength(1);
      expect(settings[0]!.key).toBe('allow_landlord_registration');
    });

    it('updateSetting upserts value and logs audit record', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'max_images_per_property',
        value: 12,
      });
      mockPrisma.systemSetting.upsert.mockResolvedValue({
        key: 'max_images_per_property',
        value: 15,
      });

      const updated = await adminSettingsService.updateSetting(
        'max_images_per_property',
        15,
        'admin-1',
      );

      expect(updated.value).toBe(15);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SYSTEM_SETTING_UPDATED',
          targetId: 'max_images_per_property',
          actorId: 'admin-1',
        }),
      );
    });
  });
});
