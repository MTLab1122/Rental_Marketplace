import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RegisterDeviceRequestDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getDevices(@CurrentUser('sub') userId: string) {
    const devices = await this.notificationService.getUserDevices(userId);
    return { success: true, data: devices };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(@CurrentUser('sub') userId: string, @Body() dto: RegisterDeviceRequestDto) {
    const device = await this.notificationService.registerDevice(
      userId,
      dto.fcmToken,
      dto.platform,
    );
    return { success: true, data: device };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteDevice(@Param('id') deviceId: string, @CurrentUser('sub') userId: string) {
    const result = await this.notificationService.deleteDevice(deviceId, userId);
    return { success: true, data: result };
  }
}
