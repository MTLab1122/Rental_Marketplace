import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { UserDataExportDto } from '@rental-peshawar/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class DataPlatformService {
  private readonly logger = new Logger(DataPlatformService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * User Data Export Workflow (GDPR & Data Portability Compliance).
   * Compiles an auditable export of all user activity across Peshawar Rental Marketplace.
   */
  async exportUserData(userId: string): Promise<UserDataExportDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantProfile: true,
        landlordProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const properties = await this.prisma.property.findMany({
      where: { landlordId: userId },
      select: { id: true, title: true, monthlyRentPkr: true, status: true, createdAt: true },
    });

    const inquiries = await this.prisma.inquiry.findMany({
      where: { OR: [{ tenantId: userId }, { landlordId: userId }] },
      select: { id: true, propertyId: true, status: true, message: true, createdAt: true },
    });

    const bookings = await this.prisma.booking.findMany({
      where: { OR: [{ tenantId: userId }, { landlordId: userId }] },
      select: {
        id: true,
        propertyId: true,
        status: true,
        monthlyRentPkr: true,
        startDate: true,
        endDate: true,
      },
    });

    const payments = await this.prisma.payment.findMany({
      where: { OR: [{ payerId: userId }, { recipientId: userId }] },
      select: {
        id: true,
        bookingId: true,
        amountPkr: true,
        status: true,
        provider: true,
        createdAt: true,
      },
    });

    const reviews = await this.prisma.review.findMany({
      where: { tenantId: userId },
      select: { id: true, propertyId: true, overallRating: true, comment: true, createdAt: true },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'USER_DATA_EXPORTED',
      targetType: 'USER',
      targetId: userId,
    });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        roles: (user as any).roles || [],
        createdAt: user.createdAt.toISOString(),
      },
      properties,
      inquiries,
      bookings,
      payments,
      reviews,
    };
  }

  /**
   * PII Deletion & Anonymization Workflow (Right-to-be-Forgotten Compliance).
   * Replaces personally identifiable attributes with cryptographic hashes while preserving financial ledger integrity.
   */
  async anonymizeUserData(
    userId: string,
    adminId?: string,
  ): Promise<{ success: boolean; anonymizedUserId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const anonymizedHash = crypto
      .createHash('sha256')
      .update(`${userId}:${Date.now()}`)
      .digest('hex')
      .substring(0, 12);
    const anonymizedEmail = `anonymized_${anonymizedHash}@purged.rental-peshawar.pk`;
    const anonymizedPhone = `+92000${Math.floor(1000000 + Math.random() * 9000000)}`;

    await this.prisma.$transaction(async (tx) => {
      // 1. Anonymize user record
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: `Anonymized User ${anonymizedHash.toUpperCase()}`,
          email: anonymizedEmail,
          phoneNumber: anonymizedPhone,
          isSuspended: true,
          suspendedReason: 'Account purged under PII Right-to-be-Forgotten policy',
          passwordHash: 'DELETED',
        },
      });

      // 2. Anonymize landlord CNIC profile if exists
      await tx.landlordProfile.updateMany({
        where: { userId },
        data: {
          cnicNumber: null,
          isCnicVerified: false,
          businessName: 'Purged',
          officeAddress: null,
          whatsappNumber: null,
        },
      });

      // 3. Purge verification records & document URLs
      await tx.verificationRecord.updateMany({
        where: { userId },
        data: {
          cnicNumberMasked: 'PURGED',
          cnicFrontUrl: 'PURGED',
          cnicBackUrl: 'PURGED',
          selfieUrl: 'PURGED',
          address: 'PURGED',
        },
      });
    });

    await this.auditService.log({
      actorId: adminId || userId,
      action: 'USER_PII_PURGED',
      targetType: 'USER',
      targetId: userId,
      after: { anonymizedHash },
    });

    this.logger.log(
      `[DataPlatform] Successfully purged PII for user ${userId} -> ${anonymizedEmail}`,
    );
    return { success: true, anonymizedUserId: userId };
  }

  /**
   * Applies configured retention policies:
   * Cleans logs, view events, and clicks older than retention days.
   */
  async applyRetentionPolicies(): Promise<{ cleanedTables: Record<string, number> }> {
    const policies = await this.prisma.dataRetentionPolicy.findMany();
    const defaultDays = 90;
    const cleaned: Record<string, number> = {};

    for (const policy of policies) {
      const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

      if (policy.tableName === 'property_view_events') {
        const res = await this.prisma.propertyViewEvent.deleteMany({
          where: { createdAt: { lte: cutoff } },
        });
        cleaned['property_view_events'] = res.count;
      } else if (policy.tableName === 'property_clicks') {
        const res = await this.prisma.propertyClick.deleteMany({
          where: { createdAt: { lte: cutoff } },
        });
        cleaned['property_clicks'] = res.count;
      } else if (policy.tableName === 'search_query_logs') {
        const res = await this.prisma.searchQueryLog.deleteMany({
          where: { createdAt: { lte: cutoff } },
        });
        cleaned['search_query_logs'] = res.count;
      }

      await this.prisma.dataRetentionPolicy.update({
        where: { id: policy.id },
        data: { lastRunAt: new Date() },
      });
    }

    // Default cleanup if no custom policies configured yet
    if (policies.length === 0) {
      const defaultCutoff = new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000);
      const viewsRes = await this.prisma.propertyViewEvent.deleteMany({
        where: { createdAt: { lte: defaultCutoff } },
      });
      cleaned['property_view_events'] = viewsRes.count;
    }

    this.logger.log(
      `[DataPlatform] Completed retention policy cleanup: ${JSON.stringify(cleaned)}`,
    );
    return { cleanedTables: cleaned };
  }

  /**
   * Generates PostgreSQL Declarative Partition Maintenance DDL.
   * Generates next-month partitions for high-volume time-series tables:
   * - property_impressions
   * - property_clicks
   * - search_query_logs
   * - messages
   * - notifications
   * - audit_logs
   */
  generateMonthlyPartitionDdl(year: number, month: number): string {
    const padMonth = String(month).padStart(2, '0');
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const padNextMonth = String(nextMonth).padStart(2, '0');

    const startDate = `${year}-${padMonth}-01 00:00:00+00`;
    const endDate = `${nextYear}-${padNextMonth}-01 00:00:00+00`;
    const suffix = `y${year}m${padMonth}`;

    const tables = [
      'property_view_events',
      'property_clicks',
      'search_query_logs',
      'messages',
      'notifications',
      'audit_logs',
    ];

    const ddlStatements = tables.map(
      (tbl) =>
        `-- Partition for ${tbl} for ${year}-${padMonth}\nCREATE TABLE IF NOT EXISTS "${tbl}_${suffix}" PARTITION OF "${tbl}" FOR VALUES FROM ('${startDate}') TO ('${endDate}');`,
    );

    return ddlStatements.join('\n\n');
  }
}
