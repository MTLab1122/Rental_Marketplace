import { Injectable, Logger, Optional } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import { SecurityEventService } from './security-event.service';

@Injectable()
export class SecurityDetectionService {
  private readonly logger = new Logger(SecurityDetectionService.name);

  // In-memory sliding windows fallback for environments without Redis
  private readonly memStore = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private readonly securityEventService: SecurityEventService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  /**
   * Helper to increment sliding counters with expiry.
   */
  private async incrementWindow(key: string, ttlSeconds: number): Promise<number> {
    const client = this.redis?.getClient();
    if (client) {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttlSeconds);
      }
      return count;
    }

    const now = Date.now();
    const existing = this.memStore.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.memStore.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }

    existing.count += 1;
    return existing.count;
  }

  /**
   * Detects 5 or more failed login attempts from the same IP within 10 minutes (600s).
   */
  async detectFailedLoginSpike(ipAddress: string): Promise<boolean> {
    const key = `detect:failed_login:${ipAddress}`;
    const count = await this.incrementWindow(key, 600);

    if (count >= 5) {
      this.logger.warn(
        `[ANOMALY DETECTED] Failed login spike from IP: ${ipAddress} (Count: ${count}/5 in 10m)`,
      );
      await this.securityEventService.recordSecurityEvent({
        ipAddress,
        action: 'FAILED_LOGIN_SPIKE',
        targetType: 'AUTH',
        targetId: ipAddress,
        outcome: 'FLAGGED',
        metadata: { repeatedAttempts: count },
      });
      return true;
    }

    return false;
  }

  /**
   * Detects credential-stuffing patterns (probing multiple distinct accounts from one IP).
   */
  async detectCredentialStuffing(
    ipAddress: string,
    distinctAccountsCount: number,
  ): Promise<boolean> {
    if (distinctAccountsCount >= 3) {
      this.logger.warn(
        `[ANOMALY DETECTED] Credential-stuffing pattern from IP: ${ipAddress} across ${distinctAccountsCount} accounts.`,
      );
      await this.securityEventService.recordSecurityEvent({
        ipAddress,
        action: 'CREDENTIAL_STUFFING_DETECTED',
        targetType: 'AUTH',
        targetId: ipAddress,
        outcome: 'BLOCKED',
        metadata: { distinctAccountsCount },
      });
      return true;
    }
    return false;
  }

  /**
   * Detects unauthorized horizontal privilege escalation attempts.
   */
  async detectPrivilegeEscalation(
    actorId: string,
    currentRole: string,
    attemptedRole: string,
  ): Promise<boolean> {
    const isSensitiveRole = attemptedRole === 'SUPER_ADMIN' || attemptedRole === 'ADMIN';

    if (currentRole !== 'SUPER_ADMIN' && isSensitiveRole) {
      this.logger.error(
        `[SECURITY ALERT] Privilege escalation attempt by ${actorId} attempting ${attemptedRole}`,
      );
      await this.securityEventService.recordSecurityEvent({
        actorId,
        action: 'PRIVILEGE_ESCALATION_ATTEMPT',
        targetType: 'USER_ROLE',
        targetId: attemptedRole,
        outcome: 'BLOCKED',
        riskScore: 95,
        metadata: { currentRole, attemptedRole },
      });
      return true;
    }
    return false;
  }

  /**
   * Detects IDOR / horizontal access violations.
   */
  async detectIdorAttempt(
    actorId: string,
    resourceOwnerId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    if (actorId !== resourceOwnerId) {
      this.logger.warn(
        `[IDOR DETECTED] Actor ${actorId} attempted unauthorized access to ${resourceType}:${resourceId}`,
      );
      await this.securityEventService.recordSecurityEvent({
        actorId,
        action: 'IDOR_ATTEMPT',
        targetType: resourceType,
        targetId: resourceId,
        outcome: 'DENIED',
        riskScore: 75,
        metadata: { resourceOwnerId },
      });
      return true;
    }
    return false;
  }

  /**
   * Detects duplicate image hash uploaded across different landlords (Syndicate / Scam detection).
   */
  async detectDuplicateImageHash(
    propertyId: string,
    imageChecksum: string,
    currentLandlordId: string,
    existingImages: Array<{ checksum: string; landlordId: string }>,
  ): Promise<boolean> {
    const duplicate = existingImages.find(
      (img) => img.checksum === imageChecksum && img.landlordId !== currentLandlordId,
    );

    if (duplicate) {
      this.logger.warn(
        `[FRAUD RADAR] Duplicate image checksum ${imageChecksum} detected across landlords.`,
      );
      await this.securityEventService.recordSecurityEvent({
        actorId: currentLandlordId,
        action: 'DUPLICATE_IMAGE_HASH',
        targetType: 'PROPERTY_IMAGE',
        targetId: propertyId,
        outcome: 'FLAGGED',
        riskScore: 65,
        metadata: { conflictingLandlordId: duplicate.landlordId, checksum: imageChecksum },
      });
      return true;
    }
    return false;
  }

  /**
   * Detects coordinates submitted outside the authorized Peshawar municipal bounding box.
   */
  detectGeoBoundaryViolation(lat: number, lng: number): boolean {
    // Peshawar bounding box: Lat 33.90 - 34.15, Lng 71.40 - 71.70
    const inBounds = lat >= 33.9 && lat <= 34.15 && lng >= 71.4 && lng <= 71.7;

    if (!inBounds) {
      this.logger.warn(
        `[GEO VIOLATION] Coordinates [${lat}, ${lng}] outside Peshawar service perimeter.`,
      );
      return true;
    }
    return false;
  }

  /**
   * Detects WebSocket or chat message flooding (> 30 messages/minute).
   */
  async detectMessageFlooding(userId: string, countIn1m: number): Promise<boolean> {
    if (countIn1m > 30) {
      this.logger.warn(`[FLOODING DETECTED] User ${userId} exceeded 30 messages/min.`);
      await this.securityEventService.recordSecurityEvent({
        actorId: userId,
        action: 'MESSAGE_FLOODING',
        targetType: 'CONVERSATION',
        outcome: 'BLOCKED',
        riskScore: 60,
        metadata: { count: countIn1m },
      });
      return true;
    }
    return false;
  }

  /**
   * Detects suspicious bulk data exports (> 500 records in a single query).
   */
  async detectMassExport(actorId: string, recordCount: number): Promise<boolean> {
    if (recordCount > 500) {
      this.logger.warn(`[MASS EXPORT ALERT] Actor ${actorId} exported ${recordCount} records.`);
      await this.securityEventService.recordSecurityEvent({
        actorId,
        action: 'MASS_EXPORT',
        targetType: 'DATA_EXPORT',
        outcome: 'FLAGGED',
        riskScore: 70,
        metadata: { recordCount },
      });
      return true;
    }
    return false;
  }
}
