import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { LandlordVerificationController } from './landlord-verification.controller';
import { AdminVerificationController } from './admin-verification.controller';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService } from '../auth/token.service';

@Module({
  controllers: [LandlordVerificationController, AdminVerificationController],
  providers: [VerificationService, AuditService, TokenService],
  exports: [VerificationService],
})
export class VerificationModule {}
