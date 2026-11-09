import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { maskSensitiveData } from '../security/sanitization';
import { AuditLogDto } from '@rental-peshawar/shared-types';

export interface CreateAuditLogParams {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an immutable audit log entry.
   */
  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      const sanitizedBefore = params.before
        ? (maskSensitiveData(params.before) as Record<string, unknown>)
        : undefined;

      const sanitizedAfter = params.after
        ? (maskSensitiveData(params.after) as Record<string, unknown>)
        : undefined;

      // Asynchronously log to database without blocking primary execution
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId || undefined,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId || undefined,
          before: (sanitizedBefore as any) || undefined,
          after: (sanitizedAfter as any) || undefined,
          ipAddress: params.ipAddress || undefined,
          userAgent: params.userAgent || undefined,
        },
      });

      this.logger.log(
        `[AUDIT] Action: ${params.action} | Target: ${params.targetType}:${params.targetId || 'N/A'} | Actor: ${params.actorId || 'SYSTEM'}`,
      );
    } catch (err) {
      // Never crash the primary flow if logging encounters a database hiccup, but record the incident
      this.logger.error(
        `Failed to write audit log: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Retrieves paginated audit logs for administrative inspection.
   */
  async findAuditLogs(limit = 50, cursor?: string): Promise<AuditLogDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      before: log.before as Record<string, unknown> | null,
      after: log.after as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}
