import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { ConversationGateway } from './conversation.gateway';
import { PrismaService } from '../../database/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { AuditService } from '../../common/audit/audit.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { RedisService } from '../../database/redis.service';

@Module({
  imports: [NotificationModule],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ConversationGateway,
    PrismaService,
    AuditService,
    RateLimiterService,
    RedisService,
  ],
  exports: [ConversationService, ConversationGateway],
})
export class ConversationModule {}
