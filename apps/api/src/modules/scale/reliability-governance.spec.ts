import { Test, TestingModule } from '@nestjs/testing';
import { ReliabilityService } from './reliability.service';
import { ExperimentationService } from './experimentation.service';
import { ErrorBudgetTier, FeedbackCategory, ExperimentStatus } from '@rental-peshawar/shared-types';
import { BadRequestException } from '@nestjs/common';

describe('Reliability & Experimentation Governance', () => {
  let reliabilityService: ReliabilityService;
  let experimentationService: ExperimentationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReliabilityService, ExperimentationService],
    }).compile();

    reliabilityService = module.get<ReliabilityService>(ReliabilityService);
    experimentationService = module.get<ExperimentationService>(ExperimentationService);
  });

  describe('ReliabilityService & SLO Monitoring', () => {
    it('should initialize and monitor exactly 11 core platform SLOs', () => {
      const overview = reliabilityService.getReliabilityOverview();
      expect(overview.slos).toHaveLength(11);

      const sloIds = overview.slos.map((s) => s.id);
      expect(sloIds).toContain('SLO-01'); // API Availability
      expect(sloIds).toContain('SLO-02'); // Search Latency
      expect(sloIds).toContain('SLO-03'); // Property Details Latency
      expect(sloIds).toContain('SLO-04'); // Media Upload
      expect(sloIds).toContain('SLO-05'); // Notification Latency
      expect(sloIds).toContain('SLO-06'); // Direct Messaging
      expect(sloIds).toContain('SLO-07'); // In-App Inquiry
      expect(sloIds).toContain('SLO-08'); // Booking Request
      expect(sloIds).toContain('SLO-09'); // Moderation Turnaround
      expect(sloIds).toContain('SLO-10'); // DB Transaction
      expect(sloIds).toContain('SLO-11'); // Crash-Free Sessions
    });

    it('should calculate initial cumulative error budget as GREEN tier', () => {
      const overview = reliabilityService.getReliabilityOverview();
      expect(overview.summary.tier).toBe(ErrorBudgetTier.GREEN);
      expect(overview.summary.isFeatureFreezeActive).toBe(false);
      expect(overview.summary.cumulativeConsumptionPercent).toBeLessThan(50);
    });

    it('should trigger mandatory feature freeze when error budget consumption exceeds 90%', () => {
      // Simulate high error budget exhaustion (e.g. 92%)
      const summary = reliabilityService.simulateErrorBudget(92.5);
      expect(summary.tier).toBe(ErrorBudgetTier.RED);
      expect(summary.isFeatureFreezeActive).toBe(true);
      expect(summary.activeFreezeReason).toContain('MANDATORY FEATURE FREEZE');

      const freezeStatus = reliabilityService.isFeatureFreezeActive();
      expect(freezeStatus.active).toBe(true);
      expect(freezeStatus.reason).toBeDefined();

      // Reset back to normal
      reliabilityService.simulateErrorBudget(null);
      const restored = reliabilityService.getReliabilityOverview();
      expect(restored.summary.isFeatureFreezeActive).toBe(false);
    });

    it('should record user feedback, assign sentiment, and flag low ratings for concierge outreach', () => {
      const positiveItem = reliabilityService.recordFeedback({
        rating: 5,
        category: FeedbackCategory.GENERAL,
        comment: 'Great verified listing in Hayatabad Phase 4.',
        persona: 'TENANT',
        locality: 'Hayatabad',
      });
      expect(positiveItem.sentiment).toBe('POSITIVE');
      expect(positiveItem.requiresFollowUp).toBe(false);

      const negativeItem = reliabilityService.recordFeedback({
        rating: 1,
        category: FeedbackCategory.SEARCH_QUALITY,
        comment: 'Listing photos were inaccurate regarding parking in University Town.',
        persona: 'TENANT',
        locality: 'University Town',
      });
      expect(negativeItem.sentiment).toBe('NEGATIVE');
      expect(negativeItem.requiresFollowUp).toBe(true); // Must flag concierge alert

      const summary = reliabilityService.getFeedbackSummary();
      expect(summary.totalCount).toBeGreaterThan(3);
      expect(summary.averageRating).toBeGreaterThan(0);
      expect(summary.sentimentCounts.negative).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ExperimentationService & Safety Guardrails', () => {
    it('should evaluate configured feature flags deterministically', () => {
      const flagsUserA = experimentationService.evaluateFlags({
        userId: 'usr-101',
        role: 'TENANT',
        locality: 'Hayatabad',
      });
      const flagsUserB = experimentationService.evaluateFlags({
        userId: 'usr-101',
        role: 'TENANT',
        locality: 'Hayatabad',
      });

      expect(flagsUserA).toEqual(flagsUserB);
      expect(flagsUserA['exp_search_map_preview_v2']).toBeDefined();
    });

    it('should fallback to control for users outside target role or locality', () => {
      const nonTargetRole = experimentationService.evaluateFlags({
        userId: 'usr-admin-1',
        role: 'ADMIN', // Target is TENANT
        locality: 'Hayatabad',
      });
      expect(nonTargetRole['exp_search_map_preview_v2']?.variant).toBe('control');

      const nonTargetLocality = experimentationService.evaluateFlags({
        userId: 'usr-tenant-2',
        role: 'TENANT',
        locality: 'Dalazak Road', // Target is Hayatabad or University Town
      });
      expect(nonTargetLocality['exp_search_map_preview_v2']?.variant).toBe('control');
    });

    it('should immediately halt experiment and revert users to control on emergency kill-switch', () => {
      const expKey = 'exp_search_map_preview_v2';
      const killed = experimentationService.emergencyKill(
        expKey,
        'Critical latency breach in Hayatabad edge',
      );

      expect(killed.killSwitchTriggered).toBe(true);
      expect(killed.status).toBe(ExperimentStatus.HALTED_GUARDRAIL);

      // Verify that evaluating flags now returns control unconditionally
      const evaluated = experimentationService.evaluateFlags({
        userId: 'usr-101',
        role: 'TENANT',
        locality: 'Hayatabad',
      });
      expect(evaluated[expKey]?.variant).toBe('control');

      // Attempting to re-enable while kill-switch is active must throw
      expect(() => experimentationService.toggleExperiment(expKey, true)).toThrow(
        BadRequestException,
      );
    });

    it('should strictly reject any experiment that violates core safety invariants', () => {
      // 1. Eligibility Segregation Invariant
      expect(() =>
        experimentationService.validateGuardrailIntegrity({ altersEligibility: true }),
      ).toThrow('GUARDRAIL VIOLATION: Experiments cannot modify or bypass tenant eligibility');

      // 2. Geofence Boundary Invariant
      expect(() =>
        experimentationService.validateGuardrailIntegrity({ bypassesGeofence: true }),
      ).toThrow('GUARDRAIL VIOLATION: Experiments cannot bypass municipal Peshawar geofencing');

      // 3. Content Moderation Invariant
      expect(() =>
        experimentationService.validateGuardrailIntegrity({ bypassesModeration: true }),
      ).toThrow('GUARDRAIL VIOLATION: Experiments cannot serve unapproved or suspended listings');

      // 4. Privacy & PII Invariant
      expect(() => experimentationService.validateGuardrailIntegrity({ exposesPii: true })).toThrow(
        'GUARDRAIL VIOLATION: Experiments cannot expose raw CNIC',
      );

      // Clean check should pass
      expect(
        experimentationService.validateGuardrailIntegrity({
          altersEligibility: false,
          bypassesGeofence: false,
          bypassesModeration: false,
          exposesPii: false,
        }),
      ).toBe(true);
    });
  });
});
