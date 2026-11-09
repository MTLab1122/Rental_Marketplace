import { Module } from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { InquiryController, LandlordInquiryController } from './inquiry.controller';
import { PrismaService } from '../../database/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { ConversationModule } from '../conversation/conversation.module';
import { AuditService } from '../../common/audit/audit.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { RedisService } from '../../database/redis.service';

@Module({
  imports: [NotificationModule, ConversationModule],
  controllers: [InquiryController, LandlordInquiryController],
  providers: [InquiryService, PrismaService, AuditService, RateLimiterService, RedisService],
  exports: [InquiryService],
})
export class InquiryModule {}
