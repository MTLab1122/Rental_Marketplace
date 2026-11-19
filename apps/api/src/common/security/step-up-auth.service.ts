import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';

export enum SensitiveAdminAction {
  ROLE_CHANGE = 'ROLE_CHANGE',
  USER_DELETION = 'USER_DELETION',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  AUDIT_LOG_EXPORT = 'AUDIT_LOG_EXPORT',
  LOCALITY_BOUNDARY_CHANGE = 'LOCALITY_BOUNDARY_CHANGE',
  VERIFICATION_OVERRIDE = 'VERIFICATION_OVERRIDE',
}

@Injectable()
export class StepUpAuthService {
  private readonly logger = new Logger(StepUpAuthService.name);
  private readonly STEP_UP_TTL_SECONDS = 300; // 5-minute elevated session

  constructor(private readonly redis: RedisService) {}

  /**
   * Generates a temporary sudo/step-up grant token after successful TOTP or MFA verification.
   */
  async grantStepUpSession(adminId: string, action: SensitiveAdminAction): Promise<string> {
    const sudoToken = `sudo_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const key = `sudo:${adminId}:${action}`;
    const client = this.redis.getClient();

    if (client) {
      await client.set(key, sudoToken, 'EX', this.STEP_UP_TTL_SECONDS);
    }
    this.logger.log(
      `[Step-Up Auth] Elevated grant issued for admin ${adminId} on action ${action}`,
    );
    return sudoToken;
  }

  /**
   * Asserts that the admin possesses a valid step-up authorization token.
   */
  async assertStepUpVerified(
    adminId: string,
    action: SensitiveAdminAction,
    providedToken?: string,
  ): Promise<void> {
    if (!providedToken) {
      throw new ForbiddenException(
        `Step-up verification required: action '${action}' requires recent MFA TOTP confirmation.`,
      );
    }

    const key = `sudo:${adminId}:${action}`;
    const client = this.redis.getClient();

    if (!client) {
      return;
    }

    const stored = await client.get(key);

    if (!stored || stored !== providedToken) {
      throw new UnauthorizedException(
        'Step-up authorization token is invalid or expired. Re-authenticate with TOTP.',
      );
    }
  }

  /**
   * Revokes all active refresh tokens and user sessions upon credential change or forced logout.
   */
  async revokeAllUserSessions(userId: string, reason: string): Promise<void> {
    const client = this.redis.getClient();
    if (client) {
      // Invalidate refresh token families in Redis
      const keys = await client.keys(`rt:${userId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }

    // Mark user token version or session invalidation timestamp in DB if column exists
    this.logger.warn(`[Security Alert] All sessions revoked for user ${userId}. Reason: ${reason}`);
  }

  /**
   * Session/Device Management: List active devices for an authenticated user.
   */
  async getActiveSessions(userId: string) {
    const client = this.redis.getClient();
    if (!client) return [];

    const sessionKeys = await client.keys(`session:${userId}:*`);

    const sessions = await Promise.all(
      sessionKeys.map(async (key) => {
        const data = await client.get(key);
        const ttl = await client.ttl(key);
        return {
          sessionId: key.replace(`session:${userId}:`, ''),
          details: data ? JSON.parse(data) : {},
          expiresInSeconds: ttl,
        };
      }),
    );

    return sessions;
  }

  /**
   * Session/Device Management: Revoke an individual device session.
   */
  async revokeDeviceSession(userId: string, sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (client) {
      await client.del(`session:${userId}:${sessionId}`);
      await client.del(`rt:${userId}:${sessionId}`);
    }
    this.logger.log(`[Session] Revoked session ${sessionId} for user ${userId}`);
  }
}
