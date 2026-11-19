import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JobQueueService } from './job-queue.service';
import { BackgroundJobName } from '@rental-peshawar/shared-types';

@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: JobQueueService,
  ) {}

  /**
   * Fetches dead-letter jobs with optional filtering.
   */
  async getDeadLetterJobs(filter?: { queueName?: string; isResolved?: boolean }) {
    const where: any = {};
    if (filter?.queueName) where.queueName = filter.queueName;
    if (filter?.isResolved !== undefined) where.isResolved = filter.isResolved;

    return this.prisma.deadLetterJob.findMany({
      where,
      orderBy: { failedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Manually retries a dead-letter job (Admin action).
   * Re-enqueues the job with fresh attempts and marks the DLQ entry as resolved.
   */
  async retryJob(dlqId: string, adminId: string) {
    const dlqRecord = await this.prisma.deadLetterJob.findUnique({
      where: { id: dlqId },
    });

    if (!dlqRecord) {
      throw new NotFoundException(`Dead-letter job ${dlqId} not found`);
    }

    // Re-enqueue the job
    const job = await this.queueService.addJob(
      dlqRecord.jobName as BackgroundJobName,
      dlqRecord.payload as Record<string, any>,
      { maxAttempts: 3 },
    );

    // Mark as resolved
    const updated = await this.prisma.deadLetterJob.update({
      where: { id: dlqId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    this.logger.log(`[DLQ] Admin ${adminId} re-enqueued dead-letter job ${dlqId} as ${job?.id}`);
    return { success: true, reEnqueuedJobId: job?.id, dlqJob: updated };
  }

  /**
   * Marks a dead-letter job as dismissed/resolved without re-enqueueing.
   */
  async resolveJob(dlqId: string, adminId: string) {
    return this.prisma.deadLetterJob.update({
      where: { id: dlqId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });
  }
}
