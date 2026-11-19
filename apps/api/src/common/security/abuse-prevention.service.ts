import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import { isDisposableEmail } from './sanitization';

export enum VelocityAction {
  CREATE_LISTING = 'CREATE_LISTING',
  SUBMIT_INQUIRY = 'SUBMIT_INQUIRY',
  SEND_MESSAGE = 'SEND_MESSAGE',
  SUBMIT_REPORT = 'SUBMIT_REPORT',
  SUBMIT_REVIEW = 'SUBMIT_REVIEW',
  FAILED_LOGIN = 'FAILED_LOGIN',
}

interface VelocityRule {
  limit: number;
  windowSeconds: number;
  errorMessage: string;
}

@Injectable()
export class AbusePreventionService {
  private readonly logger = new Logger(AbusePreventionService.name);

  // Velocity rules configured per OWASP abuse standards
  private readonly RULES: Record<VelocityAction, VelocityRule> = {
    [VelocityAction.CREATE_LISTING]: {
      limit: 10,
      windowSeconds: 86400, // 24 hours
      errorMessage: 'Listing creation limit exceeded (max 10 properties per 24 hours).',
    },
    [VelocityAction.SUBMIT_INQUIRY]: {
      limit: 15,
      windowSeconds: 3600, // 1 hour
      errorMessage: 'Inquiry rate limit reached (max 15 inquiries per hour).',
    },
    [VelocityAction.SEND_MESSAGE]: {
      limit: 30,
      windowSeconds: 60, // 1 minute
      errorMessage: 'Message flooding detected. Please wait a moment before sending more messages.',
    },
    [VelocityAction.SUBMIT_REPORT]: {
      limit: 5,
      windowSeconds: 86400, // 24 hours
      errorMessage: 'Report submission limit reached (max 5 reports per day).',
    },
    [VelocityAction.SUBMIT_REVIEW]: {
      limit: 3,
      windowSeconds: 86400, // 24 hours
      errorMessage: 'Review limit reached (max 3 reviews per day).',
    },
    [VelocityAction.FAILED_LOGIN]: {
      limit: 5,
      windowSeconds: 900, // 15 minutes lockout
      errorMessage: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
    },
  };

  constructor(private readonly redis: RedisService) {}

  /**
   * Asserts that a user/IP has not breached velocity limits.
   */
  async checkVelocity(action: VelocityAction, identifier: string): Promise<void> {
    const rule = this.RULES[action];
    const key = `velocity:${action}:${identifier}`;
    const client = this.redis.getClient();

    if (!client) {
      // In dev or test environments without active Redis, permit execution
      return;
    }

    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, rule.windowSeconds);
    }

    if (current > rule.limit) {
      this.logger.warn(
        `[Velocity Breached] Action: ${action}, ID: ${identifier}, Count: ${current}/${rule.limit}`,
      );
      throw new HttpException(rule.errorMessage, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Validates email is not from a disposable/temporary domain.
   */
  validateRegistrationEmail(email: string): void {
    if (isDisposableEmail(email)) {
      throw new HttpException(
        'Registration with disposable or temporary email addresses is prohibited.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Checks whether an identifier is shadow-restricted.
   */
  async isShadowRestricted(userId: string): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) return false;
    const isRestricted = await client.get(`shadow_restrict:${userId}`);
    return Boolean(isRestricted);
  }

  /**
   * Applies shadow restriction to an abusive account.
   */
  async applyShadowRestriction(userId: string, durationSeconds: number = 86400): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    await client.set(`shadow_restrict:${userId}`, 'true', 'EX', durationSeconds);
    this.logger.warn(
      `[Abuse Radar] Applied shadow restriction to account ${userId} for ${durationSeconds}s`,
    );
  }
}
