import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  ReportStatus,
  ReportReason,
  NotificationType,
  ErrorCode,
} from '@rental-peshawar/shared-types';
import { NotFoundException } from '@nestjs/common';

describe('ReportService', () => {
  let service: ReportService;

  const reporterId = '11111111-1111-1111-1111-111111111111';
  const targetPropertyId = '22222222-2222-2222-2222-222222222222';
  const reportId = 'rep-1111-1111';

  const mockReport = {
    id: reportId,
    reporterId,
    targetType: 'PROPERTY',
    targetId: targetPropertyId,
    reason: ReportReason.FAKE_LISTING,
    details: 'The pictures belong to another property in Hayatabad',
    status: ReportStatus.OPEN,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    property: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    report: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  describe('createReport', () => {
    it('throws NotFoundException if target property does not exist', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.createReport(reporterId, {
          targetType: 'PROPERTY',
          targetId: 'invalid-id',
          reason: ReportReason.MISLEADING_INFORMATION,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects duplicate active report with 409 DUPLICATE_REPORT', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({ id: targetPropertyId });
      mockPrismaService.report.findFirst.mockResolvedValue(mockReport);

      await expect(
        service.createReport(reporterId, {
          targetType: 'PROPERTY',
          targetId: targetPropertyId,
          reason: ReportReason.FAKE_LISTING,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.DUPLICATE_REPORT,
          }),
        }),
      );
    });

    it('successfully creates report when valid and not duplicate', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue({ id: targetPropertyId });
      mockPrismaService.report.findFirst.mockResolvedValue(null);
      mockPrismaService.report.create.mockResolvedValue(mockReport);

      const res = await service.createReport(reporterId, {
        targetType: 'PROPERTY',
        targetId: targetPropertyId,
        reason: ReportReason.FAKE_LISTING,
        details: 'The pictures belong to another property in Hayatabad',
      });

      expect(res.status).toBe(ReportStatus.OPEN);
      expect(mockPrismaService.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reporterId,
            targetType: 'PROPERTY',
            targetId: targetPropertyId,
            reason: ReportReason.FAKE_LISTING,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('getMyReports', () => {
    it('returns reports filed by reporter', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([mockReport]);

      const res = await service.getMyReports(reporterId);
      expect(res).toHaveLength(1);
      expect(res[0]!.id).toBe(reportId);
    });
  });

  describe('reviewReport', () => {
    it('admin resolves report and notifies reporter', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        resolutionNotes: 'Property has been investigated and suspended.',
      });

      const res = await service.reviewReport(reportId, 'admin-1', {
        status: ReportStatus.RESOLVED,
        resolutionNotes: 'Property has been investigated and suspended.',
      });

      expect(res.status).toBe(ReportStatus.RESOLVED);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        reporterId,
        NotificationType.SYSTEM,
        expect.any(String),
        expect.stringContaining('Property has been investigated and suspended.'),
        expect.objectContaining({ reportId, status: ReportStatus.RESOLVED }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'admin:report_resolved' }),
      );
    });
  });
});
