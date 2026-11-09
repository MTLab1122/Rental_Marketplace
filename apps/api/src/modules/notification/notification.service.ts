import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  /**
   * List notifications for a specific user with pagination.
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID '${notificationId}' not found.`);
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return {
      success: true,
      updatedCount: result.count,
    };
  }

  /**
   * Registers or updates an FCM device token for push notifications.
   */
  async registerDevice(userId: string, fcmToken: string, platform: string) {
    const device = await this.prisma.deviceToken.upsert({
      where: { fcmToken },
      update: {
        userId,
        platform,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        fcmToken,
        platform,
        lastActiveAt: new Date(),
      },
    });

    this.logger.log(`Registered device token for user ${userId} on platform ${platform}`);
    return device;
  }

  /**
   * Deletes a registered device token.
   */
  async deleteDevice(deviceId: string, userId: string) {
    const device = await this.prisma.deviceToken.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new NotFoundException(`Device token with ID '${deviceId}' not found.`);
    }

    await this.prisma.deviceToken.delete({
      where: { id: deviceId },
    });

    return { success: true, message: 'Device token removed successfully.' };
  }

  /**
   * Lists devices for a user.
   */
  async getUserDevices(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }
}
