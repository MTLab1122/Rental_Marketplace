import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportRequestDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async createReport(@Body() dto: CreateReportRequestDto, @CurrentUser() user: { sub: string }) {
    return this.reportService.createReport(user.sub, dto);
  }

  @Get('my')
  async getMyReports(@CurrentUser() user: { sub: string }) {
    return this.reportService.getMyReports(user.sub);
  }
}
