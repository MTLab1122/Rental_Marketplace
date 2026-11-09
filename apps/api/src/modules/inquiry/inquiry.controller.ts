import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
    const inquiry = await this.inquiryService.createInquiry(user.sub, dto, user);
    return { success: true, data: inquiry };
  }

  @Get('my')
  async getMyInquiriesExplicit(@CurrentUser('sub') userId: string) {
    const list = await this.inquiryService.getMyInquiries(userId);
    return { success: true, data: list };
  }

  @Get()
  async getMyInquiries(@CurrentUser('sub') userId: string) {
    const list = await this.inquiryService.getMyInquiries(userId);
    return { success: true, data: list };
  }

  @Get(':id')
  async getInquiryById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    const inquiry = await this.inquiryService.getInquiryById(id, user.sub, user.roles || []);
    return { success: true, data: inquiry };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusRequestDto,
    @CurrentUser('sub') landlordId: string,
  ) {
    const updated = await this.inquiryService.updateStatusByLandlord(id, landlordId, dto);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteInquiry(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    const result = await this.inquiryService.deleteInquiry(id, user.sub, user.roles || []);
    return result;
  }
}

@Controller('landlord/inquiries')
@UseGuards(JwtAuthGuard)
export class LandlordInquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Get()
  async getLandlordInquiries(@CurrentUser('sub') landlordId: string) {
    const list = await this.inquiryService.getLandlordInquiries(landlordId);
    return { success: true, data: list };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusRequestDto,
    @CurrentUser('sub') landlordId: string,
  ) {
    const updated = await this.inquiryService.updateStatusByLandlord(id, landlordId, dto);
    return { success: true, data: updated };
  }
}
