import { Module } from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { InquiryController } from './inquiry.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationModule } from '../notification/notification.module';
import { TokenService } from '../auth/token.service';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [InquiryController],
  providers: [InquiryService, AuditService, TokenService],
  exports: [InquiryService],
})
export class InquiryModule {}
