import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { DeadLetterService } from './dead-letter.service';
import { OutboxService } from '../events/outbox.service';
import { CacheManagerService } from '../cache/cache-manager.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, DomainEventType } from '@rental-peshawar/shared-types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class JobsController {
  constructor(
    private readonly queueService: JobQueueService,
    private readonly dlqService: DeadLetterService,
    private readonly outboxService: OutboxService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @Get('jobs/metrics')
  async getQueueMetrics() {
    const metrics = await this.queueService.getQueueMetrics();
    return { success: true, data: metrics };
  }

  @Get('jobs/dlq')
  async getDeadLetterJobs(
    @Query('queueName') queueName?: string,
    @Query('isResolved') isResolved?: string,
  ) {
    const jobs = await this.dlqService.getDeadLetterJobs({
      queueName,
      isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
    });
    return { success: true, data: jobs };
  }

  @Post('jobs/dlq/:id/retry')
  @HttpCode(HttpStatus.OK)
  async retryDlqJob(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const result = await this.dlqService.retryJob(id, adminId);
    return { success: true, data: result };
  }

  @Post('jobs/dlq/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDlqJob(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const result = await this.dlqService.resolveJob(id, adminId);
    return { success: true, data: result };
  }

  @Post('jobs/outbox/process')
  @HttpCode(HttpStatus.OK)
  async processOutbox(@Query('batchSize') batchSize?: number) {
    const result = await this.outboxService.processOutboxBatch(batchSize ? Number(batchSize) : 50);
    return { success: true, data: result };
  }

  @Post('events/replay')
  @HttpCode(HttpStatus.OK)
  async replayEvents(@Body() dto: { fromTimestamp: string; eventTypes?: DomainEventType[] }) {
    const result = await this.outboxService.replayEvents(
      new Date(dto.fromTimestamp),
      dto.eventTypes,
    );
    return { success: true, data: result };
  }

  @Post('cache/flush')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async flushCache() {
    await this.cacheManager.flushAll();
    return { success: true, message: 'All caches flushed successfully' };
  }

  @Post('cache/invalidate')
  @HttpCode(HttpStatus.OK)
  async invalidateCache(
    @Body() dto: { type: 'property' | 'locality' | 'amenities'; targetId?: string },
  ) {
    if (dto.type === 'property' && dto.targetId) {
      await this.cacheManager.invalidateProperty(dto.targetId);
    } else if (dto.type === 'locality') {
      await this.cacheManager.invalidateLocality(dto.targetId);
    } else if (dto.type === 'amenities') {
      await this.cacheManager.invalidateAmenities();
    }
    return { success: true, message: `Cache invalidated for type ${dto.type}` };
  }
}
