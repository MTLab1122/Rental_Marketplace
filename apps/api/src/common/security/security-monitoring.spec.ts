import { SecurityEventService } from './security-event.service';
import { SecurityDetectionService } from './security-detection.service';
import { IncidentResponseService, IncidentSeverity } from './incident-response.service';
import { StepUpAuthService } from './step-up-auth.service';

describe('Continuous Security Monitoring, Incident Response & Governance (Phase 18)', () => {
  let eventService: SecurityEventService;
  let detectionService: SecurityDetectionService;
  let incidentService: IncidentResponseService;
  let mockPrisma: any;
  let mockStepUpAuth: any;
  let loggedEvents: any[];
  let revokedUsers: string[];

  beforeEach(() => {
    loggedEvents = [];
    revokedUsers = [];

    mockPrisma = {
      auditLog: {
        create: async (args: any) => {
          loggedEvents.push(args.data);
          return { id: 'audit-1', ...args.data };
        },
      },
      user: {
        update: async (args: any) => ({ id: args.where.id, ...args.data }),
      },
      property: {
        update: async (args: any) => ({ id: args.where.id, ...args.data }),
        updateMany: async () => ({ count: 3 }),
      },
      booking: {
        update: async (args: any) => ({ id: args.where.id, ...args.data }),
      },
    };

    mockStepUpAuth = {
      revokeAllUserSessions: async (userId: string) => {
        revokedUsers.push(userId);
      },
    };

    eventService = new SecurityEventService(mockPrisma as any);
    detectionService = new SecurityDetectionService(eventService);
    incidentService = new IncidentResponseService(
      eventService,
      mockStepUpAuth as unknown as StepUpAuthService,
      mockPrisma as any,
    );
  });

  describe('Security Event Ingestion & Risk Scoring', () => {
    it('normalizes security event, computes quantitative risk score, and records audit record', async () => {
      const record = await eventService.recordSecurityEvent({
        actorId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
        action: 'PRIVILEGE_ESCALATION_ATTEMPT',
        targetType: 'USER_ROLE',
        targetId: 'SUPER_ADMIN',
        outcome: 'BLOCKED',
        ipAddress: '192.168.1.10',
      });

      expect(record.id).toMatch(/^sec_\d+_/);
      expect(record.riskScore).toBeGreaterThanOrEqual(85);
      expect(loggedEvents.length).toBe(1);
      expect(loggedEvents[0].action).toBe('PRIVILEGE_ESCALATION_ATTEMPT');
      expect(loggedEvents[0].after.outcome).toBe('BLOCKED');
    });

    it('calculates elevated risk scores for failed logins with repeated attempts', () => {
      const score = eventService.calculateRiskScore('LOGIN_FAILED', 'DENIED', {
        repeatedAttempts: 5,
      });
      expect(score).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Security Anomaly Detection Rules', () => {
    it('detects 5 or more failed login attempts from same IP within 10 minutes', async () => {
      const ip = '103.255.4.12';

      for (let i = 0; i < 4; i++) {
        const triggered = await detectionService.detectFailedLoginSpike(ip);
        expect(triggered).toBe(false);
      }

      const fifthAttempt = await detectionService.detectFailedLoginSpike(ip);
      expect(fifthAttempt).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'FAILED_LOGIN_SPIKE')).toBe(true);
    });

    it('detects credential-stuffing patterns probing multiple distinct accounts', async () => {
      const isStuffing = await detectionService.detectCredentialStuffing('103.255.4.12', 3);
      expect(isStuffing).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'CREDENTIAL_STUFFING_DETECTED')).toBe(true);
    });

    it('detects horizontal privilege escalation to sensitive admin roles', async () => {
      const escalated = await detectionService.detectPrivilegeEscalation(
        'user-attacker',
        'TENANT',
        'ADMIN',
      );
      expect(escalated).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'PRIVILEGE_ESCALATION_ATTEMPT')).toBe(true);
    });

    it('detects IDOR / horizontal unauthorized access attempts', async () => {
      const isIdor = await detectionService.detectIdorAttempt(
        'tenant-1',
        'tenant-2',
        'INQUIRY',
        'inq-99',
      );
      expect(isIdor).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'IDOR_ATTEMPT')).toBe(true);
    });

    it('detects duplicate image hashes across different landlords (scam syndication)', async () => {
      const existing = [{ checksum: 'sha256_hash_abc123', landlordId: 'landlord-original' }];
      const isDuplicate = await detectionService.detectDuplicateImageHash(
        'prop-new',
        'sha256_hash_abc123',
        'landlord-copycat',
        existing,
      );

      expect(isDuplicate).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'DUPLICATE_IMAGE_HASH')).toBe(true);
    });

    it('detects property coordinates falling outside the Peshawar municipal boundary', () => {
      // Inside Peshawar (e.g. University Town)
      expect(detectionService.detectGeoBoundaryViolation(34.015, 71.524)).toBe(false);

      // Outside Peshawar (e.g. Islamabad coordinates)
      expect(detectionService.detectGeoBoundaryViolation(33.684, 73.047)).toBe(true);
    });

    it('detects WebSocket message flooding exceeding 30 msgs/min', async () => {
      const isFlooding = await detectionService.detectMessageFlooding('tenant-spammer', 35);
      expect(isFlooding).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'MESSAGE_FLOODING')).toBe(true);
    });

    it('detects mass bulk data exports exceeding 500 records', async () => {
      const isMassExport = await detectionService.detectMassExport('admin-user', 1200);
      expect(isMassExport).toBe(true);
      expect(loggedEvents.some((e) => e.action === 'MASS_EXPORT')).toBe(true);
    });
  });

  describe('Automated Incident Response Playbooks', () => {
    it('Playbook: Compromised User Account revokes sessions and applies containment lock', async () => {
      const resolution = await incidentService.handleCompromisedUser(
        'user-victim-1',
        'Repeated failed logins and suspicious IP location',
      );

      expect(resolution.severity).toBe(IncidentSeverity.SEV3);
      expect(resolution.status).toBe('CONTAINED');
      expect(resolution.actionsTaken).toContain('REVOKED_ALL_ACTIVE_SESSIONS');
      expect(resolution.actionsTaken).toContain('ACCOUNT_CONTAINMENT_LOCK_APPLIED');
      expect(revokedUsers).toContain('user-victim-1');
    });

    it('Playbook: Compromised Landlord Account revokes sessions and unpublishes all active listings', async () => {
      const resolution = await incidentService.handleCompromisedLandlord(
        'landlord-scam-1',
        'Account takeover detected via anomalous password reset',
      );

      expect(resolution.severity).toBe(IncidentSeverity.SEV2);
      expect(resolution.status).toBe('CONTAINED');
      expect(resolution.actionsTaken).toContain('REVOKED_LANDLORD_SESSIONS');
      expect(resolution.actionsTaken).toContain('SUSPENDED_3_ACTIVE_LISTINGS');
      expect(revokedUsers).toContain('landlord-scam-1');
    });

    it('Playbook: Suspicious Payment freezes escrow disbursement and flags booking as disputed', async () => {
      const resolution = await incidentService.handleSuspiciousPayment(
        'pay-999',
        'book-123',
        'Payment intent replay detected',
      );

      expect(resolution.severity).toBe(IncidentSeverity.SEV2);
      expect(resolution.status).toBe('CONTAINED');
      expect(resolution.actionsTaken).toContain('BOOKING_STATUS_SET_TO_DISPUTED');
      expect(resolution.actionsTaken).toContain('ESCROW_PAYOUT_FREEZE_APPLIED');
    });

    it('Playbook: Fraudulent Listing unpublishes listing and records moderation evidence', async () => {
      const resolution = await incidentService.handleFraudulentListing(
        'prop-fake-42',
        'Stolen photos and fake ownership deed reported',
      );

      expect(resolution.severity).toBe(IncidentSeverity.SEV3);
      expect(resolution.status).toBe('CONTAINED');
      expect(resolution.actionsTaken).toContain('LISTING_STATUS_SET_TO_REJECTED');
    });

    it('Playbook: Database Compromise declares critical SEV1 and triggers emergency alert', async () => {
      const resolution = await incidentService.handleDatabaseCompromise(
        'Unusual DDL drop table query from unauthorized IP',
      );

      expect(resolution.severity).toBe(IncidentSeverity.SEV1);
      expect(resolution.status).toBe('ACTIVE');
      expect(resolution.actionsTaken).toContain('TRIGGERED_EMERGENCY_SEV1_ALERT');
      expect(resolution.actionsTaken).toContain('NOTIFIED_INCIDENT_COMMANDER_AND_CISO');
    });

    it('Playbook: DDoS / Abuse Spike restricts abusive IP and enables WAF challenge', async () => {
      const resolution = await incidentService.handleDdosAbuseSpike('198.51.100.4', 'API_FLOOD');

      expect(resolution.severity).toBe(IncidentSeverity.SEV2);
      expect(resolution.status).toBe('CONTAINED');
      expect(resolution.actionsTaken).toContain('APPLIED_IP_RATE_LIMIT_ON_198.51.100.4');
      expect(resolution.actionsTaken).toContain('ENABLED_WAF_CHALLENGE_MODE');
    });

    it('Playbook: Data Exposure categorizes SEV1 for large breaches and triggers disclosure workflow', async () => {
      const resolution = await incidentService.handleDataExposure({
        affectedRecordsCount: 500,
        scope: 'Tenant contact numbers',
      });

      expect(resolution.severity).toBe(IncidentSeverity.SEV1);
      expect(resolution.status).toBe('ACTIVE');
      expect(resolution.actionsTaken).toContain('QUEUED_LEGAL_AND_REGULATORY_DISCLOSURE_WORKFLOW');
    });
  });
});
