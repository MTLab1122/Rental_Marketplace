import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobQueueService } from './job-queue.service';
import { JobWorkerService } from './job-worker.service';
import { DeadLetterService } from './dead-letter.service';
import { RedisService } from '../../database/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { EventsModule } from '../events/events.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [NotificationModule, EventsModule, CacheModule],
  controllers: [JobsController],
  providers: [JobQueueService, JobWorkerService, DeadLetterService, RedisService, PrismaService],
  exports: [JobQueueService, JobWorkerService, DeadLetterService],
})
export class JobsModule {}
