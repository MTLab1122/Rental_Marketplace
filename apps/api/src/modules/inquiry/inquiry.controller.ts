import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { CreateInquiryRequestDto, UpdateInquiryStatusRequestDto } from './dto/inquiry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantType } from '@rental-peshawar/shared-types';

@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInquiry(
    @Body() dto: CreateInquiryRequestDto,
    @CurrentUser() user: { sub: string; tenantType?: TenantType },
  ) {
    return this.inquiryService.createInquiry(user.sub, dto, user);
  }

  @Get()
  async getMyInquiries(@CurrentUser() user: { sub: string; roles?: string[] }) {
    return this.inquiryService.getMyInquiries(user.sub, user.roles || []);
  }

  @Get(':id')
  async getInquiryById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    return this.inquiryService.getInquiryById(id, user.sub, user.roles || []);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusRequestDto,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    return this.inquiryService.updateStatus(id, user.sub, dto, user.roles || []);
  }
}
