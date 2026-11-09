import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { AdminReportController } from './admin-report.controller';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService } from '../auth/token.service';

@Module({
  controllers: [ReportController, AdminReportController],
  providers: [ReportService, AuditService, TokenService],
  exports: [ReportService],
})
export class ReportModule {}
