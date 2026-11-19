import { Module } from '@nestjs/common';
import { DataPlatformController } from './data-platform.controller';
import { DataPlatformService } from './data-platform.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Module({
  controllers: [DataPlatformController],
  providers: [DataPlatformService, PrismaService, AuditService],
  exports: [DataPlatformService],
})
export class DataPlatformModule {}
