import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { CreateReportRequestDto, ReviewReportRequestDto } from './dto/report.dto';
import { ReportStatus, NotificationType, ErrorCode } from '@rental-peshawar/shared-types';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * User files a platform report against a property or user
   */
  async createReport(reporterId: string, dto: CreateReportRequestDto) {
    // 1. Verify target exists
    if (dto.targetType === 'PROPERTY') {
      const property = await this.prisma.property.findUnique({
        where: { id: dto.targetId },
      });
      if (!property) {
        throw new NotFoundException(`Property with ID '${dto.targetId}' not found.`);
      }
    } else if (dto.targetType === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.targetId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID '${dto.targetId}' not found.`);
      }
    }

    // 2. Prevent duplicate open reports from the same reporter
    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCode.DUPLICATE_REPORT,
        message: 'You have already submitted an active report for this property or user.',
      });
    }

    // 3. Create report
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details || null,
        status: ReportStatus.OPEN,
      },
    });

    await this.auditService.log({
      actorId: reporterId,
      action: 'report:create',
      targetType: 'report',
      targetId: report.id,
      after: {
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
      },
    });

    this.logger.log(
      `Report filed by ${reporterId} on ${dto.targetType} ${dto.targetId} (reason: ${dto.reason})`,
    );
    return report;
  }

  /**
   * Get reports filed by the calling user
   */
  async getMyReports(reporterId: string) {
    return this.prisma.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: List reports with optional status filter
   */
  async getAllReportsAdmin(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        reporter: {
          select: { id: true, email: true, fullName: true, phoneNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: Review and resolve a report
   */
  async reviewReport(reportId: string, adminId: string, dto: ReviewReportRequestDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID '${reportId}' not found.`);
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes || null,
        resolvedById: adminId,
      },
    });

    // Notify the reporter
    await this.notificationService.notify(
      report.reporterId,
      NotificationType.SYSTEM,
      'Report Status Updated',
      `Your report on ${report.targetType.toLowerCase()} has been updated to ${dto.status}. ${dto.resolutionNotes || ''}`,
      { reportId, status: dto.status },
    );

    await this.auditService.log({
      actorId: adminId,
      action: `admin:report_${dto.status.toLowerCase()}`,
      targetType: 'report',
      targetId: reportId,
      before: { status: report.status },
      after: { status: updated.status, resolutionNotes: updated.resolutionNotes },
    });

    return updated;
  }
}
