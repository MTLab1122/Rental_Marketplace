import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DataPlatformService } from './data-platform.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/data-platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class DataPlatformController {
  constructor(private readonly dataPlatformService: DataPlatformService) {}

  @Get('export/:userId')
  async exportUserData(@Param('userId') userId: string) {
    const exportData = await this.dataPlatformService.exportUserData(userId);
    return { success: true, data: exportData };
  }

  @Post('anonymize/:userId')
  @HttpCode(HttpStatus.OK)
  async anonymizeUserData(@Param('userId') userId: string, @CurrentUser('sub') adminId: string) {
    const result = await this.dataPlatformService.anonymizeUserData(userId, adminId);
    return { success: true, data: result };
  }

  @Post('retention/run')
  @HttpCode(HttpStatus.OK)
  async runRetentionPolicies() {
    const result = await this.dataPlatformService.applyRetentionPolicies();
    return { success: true, data: result };
  }

  @Get('partitions/ddl')
  async getPartitionDdl(@Query('year') year?: number, @Query('month') month?: number) {
    const y = year ? Number(year) : new Date().getFullYear();
    const m = month ? Number(month) : new Date().getMonth() + 1;
    const ddl = this.dataPlatformService.generateMonthlyPartitionDdl(y, m);
    return { success: true, data: { year: y, month: m, ddl } };
  }
}
