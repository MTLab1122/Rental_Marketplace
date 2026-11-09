import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { DeviceController } from './device.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [NotificationController, DeviceController],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
