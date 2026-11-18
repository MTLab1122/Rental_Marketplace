import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ReviewReportRequestDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ReportStatus } from '@rental-peshawar/shared-types';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class AdminReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async getReports(@Query('status') status?: ReportStatus) {
    return this.reportService.getAllReportsAdmin(status);
  }

  @Get(':id')
  async getReportDetail(@Param('id') id: string) {
    return this.reportService.getReportById(id);
  }

  @Patch(':id')
  async reviewReport(
    @Param('id') id: string,
    @Body() dto: ReviewReportRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reportService.reviewReport(id, user.sub, dto);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveReport(
    @Param('id') id: string,
    @Body('resolutionNotes') resolutionNotes: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reportService.reviewReport(id, user.sub, {
      status: ReportStatus.RESOLVED,
      resolutionNotes: resolutionNotes || 'Report investigated and resolved',
    });
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismissReport(
    @Param('id') id: string,
    @Body('resolutionNotes') resolutionNotes: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reportService.reviewReport(id, user.sub, {
      status: ReportStatus.DISMISSED,
      resolutionNotes: resolutionNotes || 'Report reviewed and dismissed as non-violating',
    });
  }
}
