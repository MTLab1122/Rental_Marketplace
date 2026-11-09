import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispatches and stores an in-app and push notification.
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data ? (data as Prisma.InputJsonValue) : undefined,
          isRead: false,
        },
      });

      // Check if user has active registered device tokens for push notification
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: { userId },
      });

      if (deviceTokens.length > 0) {
        this.logger.log(
          `[FCM] Dispatched push notification to ${deviceTokens.length} devices for user ${userId}: "${title}"`,
        );
      }

      return notification;
    } catch (err) {
      this.logger.warn(
        `Failed to persist notification for user ${userId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}
