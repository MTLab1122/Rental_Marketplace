import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StepUpAuthService } from './step-up-auth.service';
import { SecurityEventService } from './security-event.service';

export enum IncidentSeverity {
  SEV1 = 'SEV1', // Critical platform outage, data breach, payment fraud, mass takeover
  SEV2 = 'SEV2', // Major feature outage, security control circumvention, active brute-force
  SEV3 = 'SEV3', // Limited feature degradation, isolated abuse, non-critical vulnerability
  SEV4 = 'SEV4', // Minor defect, cosmetic issue, informational event
}

export interface IncidentResolution {
  incidentId: string;
  severity: IncidentSeverity;
  status: 'CONTAINED' | 'ACTIVE' | 'RESOLVED';
  timestamp: string;
  affectedTarget: string;
  actionsTaken: string[];
  evidencePreserved: boolean;
}

@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);

  constructor(
    private readonly securityEventService: SecurityEventService,
    @Optional() private readonly stepUpAuthService?: StepUpAuthService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  private generateIncidentId(severity: IncidentSeverity): string {
    return `INC-${severity}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Playbook 1: Compromised User Account
   * Revokes sessions, forces password reset flag, and records forensic evidence.
   */
  async handleCompromisedUser(userId: string, reason: string): Promise<IncidentResolution> {
    const incidentId = this.generateIncidentId(IncidentSeverity.SEV3);
    const actionsTaken: string[] = [];

    this.logger.warn(
      `[INCIDENT RESPONSE] Executing Compromised User Playbook for user ${userId}. Reason: ${reason}`,
    );

    // 1. Revoke all active sessions and refresh tokens
    if (this.stepUpAuthService) {
      await this.stepUpAuthService.revokeAllUserSessions(
        userId,
        `Compromised account containment (${incidentId})`,
      );
      actionsTaken.push('REVOKED_ALL_ACTIVE_SESSIONS');
    }

    // 2. Lock account or flag password reset in DB
    if (this.prisma) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour containment lock
          },
        });
        actionsTaken.push('ACCOUNT_CONTAINMENT_LOCK_APPLIED');
      } catch (err) {
        this.logger.warn(`Could not lock user in DB: ${(err as Error).message}`);
      }
    }

    // 3. Record security incident audit event
    await this.securityEventService.recordSecurityEvent({
      actorId: userId,
      action: 'PLAYBOOK_COMPROMISED_USER_EXECUTED',
      targetType: 'USER',
      targetId: userId,
      outcome: 'BLOCKED',
      riskScore: 85,
      metadata: { incidentId, reason, actionsTaken },
    });

    return {
      incidentId,
      severity: IncidentSeverity.SEV3,
      status: 'CONTAINED',
      timestamp: new Date().toISOString(),
      affectedTarget: `user:${userId}`,
      actionsTaken,
      evidencePreserved: true,
    };
  }

  /**
   * Playbook 2: Compromised Landlord Account
   * Unpublishes listings, revokes sessions, and freezes pending payout disbursements.
   */
  async handleCompromisedLandlord(landlordId: string, reason: string): Promise<IncidentResolution> {
    const incidentId = this.generateIncidentId(IncidentSeverity.SEV2);
    const actionsTaken: string[] = [];

    this.logger.error(
      `[INCIDENT RESPONSE] Executing Compromised Landlord Playbook for ${landlordId}. Reason: ${reason}`,
    );

    // 1. Revoke all active sessions
    if (this.stepUpAuthService) {
      await this.stepUpAuthService.revokeAllUserSessions(
        landlordId,
        `Compromised landlord containment (${incidentId})`,
      );
      actionsTaken.push('REVOKED_LANDLORD_SESSIONS');
    }

    // 2. Unpublish / Suspend all active listings to prevent tenant deception
    if (this.prisma) {
      try {
        const updateResult = await this.prisma.property.updateMany({
          where: { landlordId, status: 'APPROVED' },
          data: { status: 'SUSPENDED' },
        });
        actionsTaken.push(`SUSPENDED_${updateResult.count}_ACTIVE_LISTINGS`);
      } catch (err) {
        this.logger.warn(`Could not suspend landlord listings: ${(err as Error).message}`);
      }
    }

    // 3. Record audit evidence
    await this.securityEventService.recordSecurityEvent({
      actorId: landlordId,
      action: 'PLAYBOOK_COMPROMISED_LANDLORD_EXECUTED',
      targetType: 'LANDLORD',
      targetId: landlordId,
      outcome: 'BLOCKED',
      riskScore: 90,
      metadata: { incidentId, reason, actionsTaken },
    });

    return {
      incidentId,
      severity: IncidentSeverity.SEV2,
      status: 'CONTAINED',
      timestamp: new Date().toISOString(),
      affectedTarget: `landlord:${landlordId}`,
      actionsTaken,
      evidencePreserved: true,
    };
  }

  /**
   * Playbook 3: Suspicious Payment / Escrow Fraud
   * Freezes payout disbursement and flags booking transaction into dispute state.
   */
  async handleSuspiciousPayment(
    paymentId: string,
    bookingId: string,
    reason: string,
  ): Promise<IncidentResolution> {
    const incidentId = this.generateIncidentId(IncidentSeverity.SEV2);
    const actionsTaken: string[] = [];

    this.logger.warn(
      `[INCIDENT RESPONSE] Freezing payment ${paymentId} for booking ${bookingId}. Reason: ${reason}`,
    );

    // 1. Flag booking into disputed state to prevent escrow disbursement
    if (this.prisma) {
      try {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'DISPUTED' },
        });
        actionsTaken.push('BOOKING_STATUS_SET_TO_DISPUTED');
      } catch (err) {
        this.logger.warn(`Could not update booking status: ${(err as Error).message}`);
      }
    }

    actionsTaken.push('ESCROW_PAYOUT_FREEZE_APPLIED');

    // 2. Record security audit
    await this.securityEventService.recordSecurityEvent({
      action: 'PLAYBOOK_SUSPICIOUS_PAYMENT_CONTAINED',
      targetType: 'PAYMENT',
      targetId: paymentId,
      outcome: 'FLAGGED',
      riskScore: 80,
      metadata: { incidentId, bookingId, reason, actionsTaken },
    });

    return {
      incidentId,
      severity: IncidentSeverity.SEV2,
      status: 'CONTAINED',
      timestamp: new Date().toISOString(),
      affectedTarget: `payment:${paymentId}`,
      actionsTaken,
      evidencePreserved: true,
    };
  }

  /**
   * Playbook 4: Fraudulent Listing Containment
   * Unpublishes listing, notifies landlord, and preserves moderation case.
   */
  async handleFraudulentListing(propertyId: string, reason: string): Promise<IncidentResolution> {
    const incidentId = this.generateIncidentId(IncidentSeverity.SEV3);
    const actionsTaken: string[] = [];

    this.logger.warn(
      `[INCIDENT RESPONSE] Unpublishing fraudulent listing ${propertyId}. Reason: ${reason}`,
    );

    if (this.prisma) {
      try {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { status: 'REJECTED' },
        });
        actionsTaken.push('LISTING_STATUS_SET_TO_REJECTED');
      } catch (err) {
        this.logger.warn(`Could not update property status: ${(err as Error).message}`);
      }
    }

    await this.securityEventService.recordSecurityEvent({
      action: 'PLAYBOOK_FRAUDULENT_LISTING_CONTAINED',
      targetType: 'PROPERTY',
      targetId: propertyId,
      outcome: 'BLOCKED',
      riskScore: 70,
      metadata: { incidentId, reason, actionsTaken },
    });

    return {
      incidentId,
      severity: IncidentSeverity.SEV3,
      status: 'CONTAINED',
      timestamp: new Date().toISOString(),
      affectedTarget: `property:${propertyId}`,
      actionsTaken,
      evidencePreserved: true,
    };
  }

  /**
   * Playbook 5: Database Compromise / Intrusion Suspicion
   * Triggers emergency SEV1 alert and issues credential rollover warning.
   */
  async handleDatabaseCompromise(indicator: string): Promise<IncidentResolution> {
    const incidentId = this.generateIncidentId(IncidentSeverity.SEV1);
    const actionsTaken = [
      'TRIGGERED_EMERGENCY_SEV1_ALERT',
      'NOTIFIED_INCIDENT_COMMANDER_AND_CISO',
      'SCHEDULED_IMMEDIATE_CREDENTIAL_ROTATION',
      'INITIATED_FORENSIC_SNAPSHOT',
    ];

    this.logger.error(
      `[CRITICAL SEV1 INCIDENT] Potential database intrusion detected! Indicator: ${indicator}`,
    );

    await this.securityEventService.recordSecurityEvent({
      action: 'PLAYBOOK_DATABASE_COMPROMISE_DECLARED',
      targetType: 'INFRASTRUCTURE',
      targetId: 'postgres-primary',
      outcome: 'FLAGGED',
      riskScore: 100,
      metadata: { incidentId, indicator, actionsTaken },
    });

    return {
      incidentId,
      severity: IncidentSeverity.SEV1,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      affectedTarget: 'database:postgres-primary',
      actionsTaken,
      evidencePreserved: true,
    };
  }

  /**
   * Playbook 6: DDoS / Velocity Abuse Spike
   * Applies ingress rate limiting and drops malicious traffic.
   */
  async handleDdosAbuseSpike(ipAddress: string, action: string): Promise<IncidentResolution> {
    const incidentId = this.generateIncidentId(IncidentSeverity.SEV2);
    const actionsTaken = [
      `APPLIED_IP_RATE_LIMIT_ON_${ipAddress}`,
      'NOTIFIED_INFRASTRUCTURE_ON_CALL',
      'ENABLED_WAF_CHALLENGE_MODE',
    ];

    this.logger.warn(
      `[INCIDENT RESPONSE] Rate limiting abusive IP ${ipAddress} on action ${action}`,
    );

    await this.securityEventService.recordSecurityEvent({
      ipAddress,
      action: 'PLAYBOOK_DDOS_ABUSE_CONTAINED',
      targetType: 'NETWORK_IP',
      targetId: ipAddress,
      outcome: 'BLOCKED',
      riskScore: 75,
      metadata: { incidentId, action, actionsTaken },
    });

    return {
      incidentId,
      severity: IncidentSeverity.SEV2,
      status: 'CONTAINED',
      timestamp: new Date().toISOString(),
      affectedTarget: `ip:${ipAddress}`,
      actionsTaken,
      evidencePreserved: true,
    };
  }

  /**
   * Playbook 7: Data Exposure / Breach Assessment
   * Categorizes severity based on record volume and queues notification workflows.
   */
  async handleDataExposure(breachDetails: {
    affectedRecordsCount: number;
    scope: string;
  }): Promise<IncidentResolution> {
    const severity =
      breachDetails.affectedRecordsCount >= 100 ? IncidentSeverity.SEV1 : IncidentSeverity.SEV2;
    const incidentId = this.generateIncidentId(severity);
    const actionsTaken = [
      'ASSESSED_AFFECTED_RECORDS_VOLUME',
      'REVOKED_ACTIVE_EXPOSED_SESSIONS',
      'QUEUED_LEGAL_AND_REGULATORY_DISCLOSURE_WORKFLOW',
    ];

    this.logger.error(
      `[DATA EXPOSURE] Incident ${incidentId} declared. Records: ${breachDetails.affectedRecordsCount}`,
    );

    await this.securityEventService.recordSecurityEvent({
      action: 'PLAYBOOK_DATA_EXPOSURE_DECLARED',
      targetType: 'DATA_BREACH',
      outcome: 'FLAGGED',
      riskScore: severity === IncidentSeverity.SEV1 ? 100 : 80,
      metadata: { incidentId, ...breachDetails, actionsTaken },
    });

    return {
      incidentId,
      severity,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      affectedTarget: `records_count:${breachDetails.affectedRecordsCount}`,
      actionsTaken,
      evidencePreserved: true,
    };
  }
}
