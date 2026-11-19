import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiServiceImpl } from './ai.service';
import { ContentModerationFlag } from '@rental-peshawar/shared-types';

@Injectable()
export class ContentModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceImpl,
  ) {}

  /**
   * Moderates user submitted text (listing description, review comment, message).
   */
  async moderateText(text: string, entityType: string, entityId: string) {
    const result = await this.aiService.moderateText(text);

    if (result.flagged) {
      for (const flag of result.flags) {
        await this.prisma.contentModerationRecord.create({
          data: {
            contentType: 'TEXT',
            entityType,
            entityId,
            flag,
            confidence: result.confidence,
            reason: result.reason || `Violation detected: ${flag}`,
            actionTaken: result.suggestedAction,
            modelVersion: this.aiService.getModelVersion(),
          },
        });
      }
    }

    return result;
  }

  /**
   * Moderates uploaded media URLs.
   */
  async moderateImage(imageUrl: string, entityType: string, entityId: string) {
    const result = await this.aiService.moderateImage(imageUrl);

    if (result.flagged) {
      for (const flag of result.flags) {
        await this.prisma.contentModerationRecord.create({
          data: {
            contentType: 'IMAGE',
            entityType,
            entityId,
            flag,
            confidence: result.confidence,
            reason: result.reason || `Image quality or safety violation: ${flag}`,
            actionTaken: result.suggestedAction,
            modelVersion: this.aiService.getModelVersion(),
          },
        });
      }
    }

    return result;
  }

  /**
   * Lists moderation records for admin queue.
   */
  async getModerationRecords(params: {
    flag?: ContentModerationFlag;
    actionTaken?: string;
    page?: number;
    limit?: number;
  }) {
    const { flag, actionTaken, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (flag) where.flag = flag;
    if (actionTaken) where.actionTaken = actionTaken;

    const [total, records] = await Promise.all([
      this.prisma.contentModerationRecord.count({ where }),
      this.prisma.contentModerationRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      records,
    };
  }

  /**
   * Admin human-in-the-loop reviewer resolution.
   */
  async reviewModerationRecord(
    recordId: string,
    adminId: string,
    reviewerAction: 'APPROVED' | 'BLOCKED' | 'DISMISSED',
  ) {
    const record = await this.prisma.contentModerationRecord.update({
      where: { id: recordId },
      data: {
        reviewerAction,
        reviewerId: adminId,
        reviewedAt: new Date(),
        actionTaken: reviewerAction,
      },
    });

    return record;
  }
}
