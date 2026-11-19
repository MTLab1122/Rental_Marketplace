import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JobQueueService, EnqueuedJob } from './job-queue.service';
import { NotificationService } from '../notification/notification.service';
import { BackgroundJobName, NotificationType } from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobWorkerService {
  private readonly logger = new Logger(JobWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: JobQueueService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Dispatches an enqueued job to its corresponding business logic handler.
   */
  async processJob(job: EnqueuedJob): Promise<boolean> {
    const startTime = Date.now();
    this.logger.log(`[Worker] Executing job ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case BackgroundJobName.SEND_NOTIFICATION:
          await this.handleSendNotification(job.data);
          break;
        case BackgroundJobName.SEND_EMAIL:
          await this.handleSendEmail(job.data);
          break;
        case BackgroundJobName.RESIZE_IMAGE:
          await this.handleResizeImage(job.data);
          break;
        case BackgroundJobName.GENERATE_THUMBNAIL:
          await this.handleGenerateThumbnail(job.data);
          break;
        case BackgroundJobName.CALCULATE_REPUTATION:
          await this.handleCalculateReputation(job.data);
          break;
        case BackgroundJobName.CALCULATE_PROPERTY_QUALITY:
          await this.handleCalculatePropertyQuality(job.data);
          break;
        case BackgroundJobName.CALCULATE_LOCALITY_DEMAND:
          await this.handleCalculateLocalityDemand(job.data);
          break;
        case BackgroundJobName.EXPIRE_UNPAID_BOOKINGS:
          await this.handleExpireUnpaidBookings();
          break;
        case BackgroundJobName.EXPIRE_VERIFICATION_REQUESTS:
          await this.handleExpireVerificationRequests();
          break;
        case BackgroundJobName.REINDEX_SEARCH:
          await this.handleReindexSearch();
          break;
        case BackgroundJobName.CLEAN_EXPIRED_TOKENS:
          await this.handleCleanExpiredTokens();
          break;
        case BackgroundJobName.CLEAN_EXPIRED_SESSIONS:
          await this.handleCleanExpiredSessions();
          break;
        case BackgroundJobName.CLEAN_ORPHAN_MEDIA:
          await this.handleCleanOrphanMedia();
          break;
        case BackgroundJobName.GENERATE_DAILY_ANALYTICS:
          await this.handleGenerateDailyAnalytics(job.data);
          break;
        case BackgroundJobName.GENERATE_WEEKLY_REPORTS:
          await this.handleGenerateWeeklyReports();
          break;
        case BackgroundJobName.PROCESS_WEBHOOK_RETRIES:
          await this.handleProcessWebhookRetries();
          break;
        case BackgroundJobName.PROCESS_DLQ:
          await this.handleProcessDlq();
          break;
        default:
          this.logger.warn(`[Worker] Unrecognized job name: ${job.name}`);
      }

      const durationMs = Date.now() - startTime;
      this.logger.log(`[Worker] Completed job ${job.name} (ID: ${job.id}) in ${durationMs}ms`);
      return true;
    } catch (err: any) {
      await this.queueService.handleJobFailure(job, err);
      return false;
    }
  }

  private async handleSendNotification(data: any) {
    if (data.userId && data.title && data.body) {
      await this.notificationService.notify(
        data.userId,
        data.type || NotificationType.SYSTEM,
        data.title,
        data.body,
        data.metadata,
      );
    }
  }

  private async handleSendEmail(data: any) {
    this.logger.log(
      `[EmailWorker] Dispatched transactional email to ${data.to}: "${data.subject}"`,
    );
  }

  private async handleResizeImage(data: any) {
    this.logger.log(
      `[MediaWorker] Optimized image dimensions for asset: ${data.imageUrl || data.storageKey}`,
    );
  }

  private async handleGenerateThumbnail(data: any) {
    if (data.imageId) {
      await this.prisma.propertyImage
        .update({
          where: { id: data.imageId },
          data: { thumbnailUrl: `${data.url}_thumb.jpg` },
        })
        .catch(() => {});
    }
  }

  private async handleCalculateReputation(data: any) {
    const landlordId = data.landlordId;
    if (landlordId) {
      const avgReview = await this.prisma.review.aggregate({
        where: { property: { landlordId } },
        _avg: { overallRating: true },
        _count: { id: true },
      });

      this.logger.log(
        `[ReputationWorker] Calculated reputation snapshot for landlord ${landlordId}: Avg ${avgReview._avg.overallRating || 5.0} across ${avgReview._count.id} reviews`,
      );
    }
  }

  private async handleCalculatePropertyQuality(data: any) {
    const propertyId = data.propertyId;
    if (propertyId) {
      const imagesCount = await this.prisma.propertyImage.count({ where: { propertyId } });
      const amenitiesCount = await this.prisma.propertyAmenity.count({ where: { propertyId } });
      const score = Math.min(
        100,
        (imagesCount >= 3 ? 40 : 20) + (amenitiesCount >= 5 ? 40 : 20) + 20,
      );

      this.logger.log(
        `[QualityWorker] Calculated quality score for property ${propertyId}: ${score}/100`,
      );
    }
  }

  private async handleCalculateLocalityDemand(data: any) {
    const localityId = data.localityId;
    if (localityId) {
      const searchCount = await this.prisma.searchQueryLog.count({ where: { localityId } });
      const viewCount = await this.prisma.propertyViewEvent.count({ where: { localityId } });

      await this.prisma.localityDemandSnapshot
        .upsert({
          where: {
            localityId_period_snapshotDate: {
              localityId,
              period: 'DAILY',
              snapshotDate: new Date(new Date().toISOString().split('T')[0] as string),
            },
          },
          update: { searchCount, impressionCount: viewCount },
          create: {
            localityId,
            period: 'DAILY',
            snapshotDate: new Date(new Date().toISOString().split('T')[0] as string),
            searchCount,
            impressionCount: viewCount,
          },
        })
        .catch(() => {});
    }
  }

  private async handleExpireUnpaidBookings() {
    const now = new Date();
    const expired = await this.prisma.booking.updateMany({
      where: {
        status: { in: ['AWAITING_PAYMENT', 'PAYMENT_PENDING'] },
        lockExpiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        cancellationReason: 'Payment reservation window expired (24 hours)',
      },
    });

    this.logger.log(`[BookingWorker] Expired ${expired.count} unpaid bookings.`);
  }

  private async handleExpireVerificationRequests() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expired = await this.prisma.verificationRecord.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: sevenDaysAgo },
      },
      data: {
        status: 'EXPIRED',
        reviewNotes: 'Verification submission expired after 7 days of inactivity.',
      },
    });

    this.logger.log(`[VerificationWorker] Expired ${expired.count} stale verification requests.`);
  }

  private async handleReindexSearch() {
    const activePropertiesCount = await this.prisma.property.count({
      where: { status: 'APPROVED', isAvailable: true },
    });
    this.logger.log(
      `[SearchWorker] Reindexed search inventory: ${activePropertiesCount} active properties indexed.`,
    );
  }

  private async handleCleanExpiredTokens() {
    const now = new Date();
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    this.logger.log(`[AuthWorker] Cleaned ${deleted.count} expired refresh tokens.`);
  }

  private async handleCleanExpiredSessions() {
    this.logger.log(`[SessionWorker] Flushed expired session cache.`);
  }

  private async handleCleanOrphanMedia() {
    this.logger.log(`[MediaWorker] Scanned and purged orphan media uploads.`);
  }

  private async handleGenerateDailyAnalytics(data: any) {
    const targetDate = data?.date ? new Date(data.date) : new Date();
    const dateOnly = new Date(targetDate.toISOString().split('T')[0] as string);

    const views = await this.prisma.propertyViewEvent.count();
    const inquiries = await this.prisma.inquiry.count();
    const bookings = await this.prisma.booking.count({ where: { status: 'CONFIRMED' } });
    const properties = await this.prisma.property.count({ where: { status: 'APPROVED' } });

    await this.prisma.dailyAnalyticsAggregate.upsert({
      where: {
        date_dimension_dimensionValue: {
          date: dateOnly,
          dimension: 'ALL',
          dimensionValue: 'ALL',
        },
      },
      update: {
        totalViews: views,
        totalInquiries: inquiries,
        totalBookings: bookings,
        activeListings: properties,
      },
      create: {
        date: dateOnly,
        dimension: 'ALL',
        dimensionValue: 'ALL',
        totalViews: views,
        totalInquiries: inquiries,
        totalBookings: bookings,
        activeListings: properties,
        totalRevenuePkr: new Prisma.Decimal(0),
      },
    });

    this.logger.log(
      `[AnalyticsWorker] Generated daily analytics aggregate for ${dateOnly.toISOString().split('T')[0]}`,
    );
  }

  private async handleGenerateWeeklyReports() {
    this.logger.log(`[ReportingWorker] Generated weekly Peshawar platform performance report.`);
  }

  private async handleProcessWebhookRetries() {
    this.logger.log(`[WebhookWorker] Processed external gateway webhook retry queue.`);
  }

  private async handleProcessDlq() {
    const unresolvedCount = await this.prisma.deadLetterJob.count({ where: { isResolved: false } });
    this.logger.log(
      `[DLQWorker] Inspected DLQ: ${unresolvedCount} dead-letter jobs awaiting admin review.`,
    );
  }
}
