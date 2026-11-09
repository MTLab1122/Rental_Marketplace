import { Module } from '@nestjs/common';
import { LocalityService } from './locality.service';
import { LocalityController } from './locality.controller';
import { AdminLocalityController } from './admin-locality.controller';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService } from '../auth/token.service';

@Module({
  controllers: [LocalityController, AdminLocalityController],
  providers: [LocalityService, AuditService, TokenService],
  exports: [LocalityService],
})
export class LocalityModule {}
