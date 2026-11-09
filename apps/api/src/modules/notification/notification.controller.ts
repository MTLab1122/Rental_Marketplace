import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GetNotificationsQueryDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser('sub') userId: string,
    @Query() query: GetNotificationsQueryDto,
  ) {
    const items = await this.notificationService.getUserNotifications(userId, query.limit);
    return { success: true, data: items };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') notificationId: string, @CurrentUser('sub') userId: string) {
    const updated = await this.notificationService.markAsRead(notificationId, userId);
    return { success: true, data: updated };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    const result = await this.notificationService.markAllAsRead(userId);
    return { success: true, data: result };
  }
}
