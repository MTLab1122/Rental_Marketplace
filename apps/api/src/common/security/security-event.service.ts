import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface SecurityEventPayload {
  timestamp?: string;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'BLOCKED' | 'FLAGGED';
  riskScore?: number; // 0 (benign) to 100 (critical)
  metadata?: Record<string, unknown>;
}

export interface SecurityEventRecord extends SecurityEventPayload {
  id: string;
  timestamp: string;
  riskScore: number;
}

@Injectable()
export class SecurityEventService {
  private readonly logger = new Logger(SecurityEventService.name);

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  /**
   * Calculates a quantitative risk score (0-100) based on action and outcome.
   */
  public calculateRiskScore(
    action: string,
    outcome: 'SUCCESS' | 'DENIED' | 'BLOCKED' | 'FLAGGED',
    metadata?: Record<string, unknown>,
  ): number {
    let base = 10;

    if (action.includes('LOGIN_FAILED')) base = 35;
    if (action.includes('PRIVILEGE_ESCALATION')) base = 85;
    if (action.includes('REFRESH_TOKEN_REUSE')) base = 90;
    if (action.includes('IDOR_ATTEMPT')) base = 75;
    if (action.includes('GEO_BOUNDARY_VIOLATION')) base = 40;
    if (action.includes('DUPLICATE_IMAGE_HASH')) base = 60;
    if (action.includes('STEP_UP_FAILED')) base = 80;
    if (action.includes('MASS_EXPORT')) base = 70;
    if (action.includes('DATABASE_BREACH')) base = 100;

    if (outcome === 'DENIED' || outcome === 'BLOCKED') {
      base = Math.min(100, base + 10);
    }
    if (outcome === 'FLAGGED') {
      base = Math.min(100, base + 20);
    }

    if (metadata && typeof metadata['repeatedAttempts'] === 'number') {
      base = Math.min(100, base + (metadata['repeatedAttempts'] as number) * 5);
    }

    return base;
  }

  /**
   * Centralizes and normalizes incoming security telemetry from API, WAF, and DB.
   */
  async recordSecurityEvent(event: SecurityEventPayload): Promise<SecurityEventRecord> {
    const timestamp = event.timestamp || new Date().toISOString();
    const riskScore =
      event.riskScore !== undefined
        ? event.riskScore
        : this.calculateRiskScore(event.action, event.outcome, event.metadata);

    const eventRecord: SecurityEventRecord = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...event,
      timestamp,
      riskScore,
    };

    // Log structured event for SIEM ingestion
    const logMessage = `[SECURITY_EVENT] Action=${event.action} Actor=${event.actorId || 'anonymous'} Outcome=${event.outcome} Risk=${riskScore} Target=${event.targetType}:${event.targetId || 'none'} IP=${event.ipAddress || 'unknown'}`;

    if (riskScore >= 80) {
      this.logger.error(logMessage);
    } else if (riskScore >= 50) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Persist to immutable audit log if database is connected
    if (this.prisma) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorId: event.actorId && /^[0-9a-f-]{36}$/i.test(event.actorId) ? event.actorId : null,
            action: event.action,
            targetType: event.targetType,
            targetId: event.targetId || null,
            after: {
              outcome: event.outcome,
              riskScore,
              requestId: event.requestId,
              metadata: event.metadata || {},
            } as Prisma.InputJsonValue,
            ipAddress: event.ipAddress || null,
            userAgent: event.userAgent || null,
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to persist security audit record: ${(err as Error).message}`);
      }
    }

    return eventRecord;
  }
}
