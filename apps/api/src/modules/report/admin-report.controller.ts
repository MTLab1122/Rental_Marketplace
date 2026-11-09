import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReviewReportRequestDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ReportStatus } from '@rental-peshawar/shared-types';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async getReports(@Query('status') status?: ReportStatus) {
    return this.reportService.getAllReportsAdmin(status);
  }

  @Patch(':id')
  async reviewReport(
    @Param('id') id: string,
    @Body() dto: ReviewReportRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reportService.reviewReport(id, user.sub, dto);
  }
}
