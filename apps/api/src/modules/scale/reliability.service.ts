import { Injectable, Logger } from '@nestjs/common';
import {
  SloMetricDto,
  ErrorBudgetSummaryDto,
  ReliabilityOverviewDto,
  SubmitFeedbackDto,
  FeedbackItemDto,
  FeedbackSummaryDto,
  ErrorBudgetTier,
  SloStatus,
  FeedbackCategory,
} from '@rental-peshawar/shared-types';

@Injectable()
export class ReliabilityService {
  private readonly logger = new Logger(ReliabilityService.name);

  // 11 Monitored Service Level Objectives (SLOs)
  private slos: Map<string, SloMetricDto> = new Map();

  // Simulated consumption override for chaos testing
  private simulatedConsumptionOverride: number | null = null;

  // In-memory feedback storage
  private feedbackList: FeedbackItemDto[] = [];

  constructor() {
    this.initializeSlos();
    this.seedInitialFeedback();
  }

  private initializeSlos() {
    const defaultSlos: SloMetricDto[] = [
      {
        id: 'SLO-01',
        name: 'API Endpoint Availability',
        category: 'AVAILABILITY',
        target: 99.9,
        unit: '%',
        currentValue: 99.94,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 0.1,
        budgetConsumedPercent: 42.0,
        burnRate1h: 0.9,
        burnRate24h: 1.1,
      },
      {
        id: 'SLO-02',
        name: 'Search & Locality Filter Latency (p95)',
        category: 'LATENCY',
        target: 350,
        unit: 'ms',
        currentValue: 282,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 350,
        budgetConsumedPercent: 38.5,
        burnRate1h: 0.8,
        burnRate24h: 0.95,
      },
      {
        id: 'SLO-03',
        name: 'Property Details View Latency (p95)',
        category: 'LATENCY',
        target: 250,
        unit: 'ms',
        currentValue: 195,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 250,
        budgetConsumedPercent: 31.0,
        burnRate1h: 0.7,
        burnRate24h: 0.85,
      },
      {
        id: 'SLO-04',
        name: 'Media Upload & Processing Success Rate',
        category: 'AVAILABILITY',
        target: 99.5,
        unit: '%',
        currentValue: 99.68,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 0.5,
        budgetConsumedPercent: 45.0,
        burnRate1h: 1.0,
        burnRate24h: 1.05,
      },
      {
        id: 'SLO-05',
        name: 'Real-time Notification Dispatch Latency (p95)',
        category: 'LATENCY',
        target: 30,
        unit: 's',
        currentValue: 14.2,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 30,
        budgetConsumedPercent: 25.0,
        burnRate1h: 0.6,
        burnRate24h: 0.75,
      },
      {
        id: 'SLO-06',
        name: 'Direct Messaging & Chat Delivery (p95)',
        category: 'LATENCY',
        target: 5,
        unit: 's',
        currentValue: 2.1,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 5,
        budgetConsumedPercent: 22.0,
        burnRate1h: 0.5,
        burnRate24h: 0.6,
      },
      {
        id: 'SLO-07',
        name: 'In-App Inquiry Delivery Latency (p95)',
        category: 'LATENCY',
        target: 10,
        unit: 's',
        currentValue: 4.8,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 10,
        budgetConsumedPercent: 30.0,
        burnRate1h: 0.7,
        burnRate24h: 0.8,
      },
      {
        id: 'SLO-08',
        name: 'Booking & Viewing Request Creation Success',
        category: 'AVAILABILITY',
        target: 99.9,
        unit: '%',
        currentValue: 99.96,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 0.1,
        budgetConsumedPercent: 28.0,
        burnRate1h: 0.6,
        burnRate24h: 0.7,
      },
      {
        id: 'SLO-09',
        name: 'Listing Moderation Turnaround (Pro Tier)',
        category: 'OPERATIONS',
        target: 24,
        unit: 'hours',
        currentValue: 3.4,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 24,
        budgetConsumedPercent: 18.0,
        burnRate1h: 0.4,
        burnRate24h: 0.5,
      },
      {
        id: 'SLO-10',
        name: 'Database Transaction Health & Deadlock Rate',
        category: 'DATA_INTEGRITY',
        target: 0.01,
        unit: '%',
        currentValue: 0.002,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 0.01,
        budgetConsumedPercent: 20.0,
        burnRate1h: 0.3,
        burnRate24h: 0.4,
      },
      {
        id: 'SLO-11',
        name: 'Web & Mobile Crash-Free Session Rate',
        category: 'AVAILABILITY',
        target: 99.8,
        unit: '%',
        currentValue: 99.91,
        status: SloStatus.HEALTHY,
        budgetTotalAllowed: 0.2,
        budgetConsumedPercent: 34.0,
        burnRate1h: 0.8,
        burnRate24h: 0.9,
      },
    ];

    for (const slo of defaultSlos) {
      this.slos.set(slo.id, slo);
    }
  }

  private seedInitialFeedback() {
    this.feedbackList = [
      {
        id: 'fb-001',
        userId: 'usr-landlord-hayatabad',
        persona: 'LANDLORD',
        rating: 5,
        category: FeedbackCategory.GENERAL,
        comment:
          'Excellent response time from verified tenants in Hayatabad Phase 2. Rental agreement generated cleanly.',
        pageUrl: '/properties',
        locality: 'Hayatabad',
        sentiment: 'POSITIVE',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        requiresFollowUp: false,
      },
      {
        id: 'fb-002',
        userId: 'usr-tenant-student',
        persona: 'TENANT',
        rating: 4,
        category: FeedbackCategory.FEATURE_REQUEST,
        comment:
          'Please add a dedicated filter for UPS and Solar backup. Warsak Road gets load-shedding during study hours.',
        pageUrl: '/search',
        locality: 'Warsak Road',
        sentiment: 'POSITIVE',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        requiresFollowUp: false,
      },
      {
        id: 'fb-003',
        userId: 'usr-tenant-family',
        persona: 'TENANT',
        rating: 2,
        category: FeedbackCategory.SEARCH_QUALITY,
        comment:
          'Found an apartment in University Town but upon physical inspection landlord stated bachelor students only.',
        pageUrl: '/properties/prop-102',
        locality: 'University Town',
        sentiment: 'NEGATIVE',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        requiresFollowUp: true,
      },
    ];
  }

  /**
   * Retrieves all 11 SLOs and the calculated cumulative Error Budget summary.
   */
  getReliabilityOverview(): ReliabilityOverviewDto {
    const sloList = Array.from(this.slos.values());

    // Calculate cumulative error budget consumption
    let cumulativeConsumption = 0;
    if (this.simulatedConsumptionOverride !== null) {
      cumulativeConsumption = this.simulatedConsumptionOverride;
    } else {
      const sum = sloList.reduce((acc, curr) => acc + curr.budgetConsumedPercent, 0);
      cumulativeConsumption = Math.round((sum / sloList.length) * 10) / 10;
    }

    // Determine error budget tier
    let tier = ErrorBudgetTier.GREEN;
    let isFeatureFreezeActive = false;
    let activeFreezeReason: string | undefined;

    if (cumulativeConsumption >= 90) {
      tier = ErrorBudgetTier.RED;
      isFeatureFreezeActive = true;
      activeFreezeReason =
        'MANDATORY FEATURE FREEZE: Monthly Error Budget consumption has exceeded 90%. All non-critical feature deployments are blocked until reliability is restored.';
    } else if (cumulativeConsumption >= 75) {
      tier = ErrorBudgetTier.ORANGE;
    } else if (cumulativeConsumption >= 50) {
      tier = ErrorBudgetTier.AMBER;
    }

    const breachedCount = sloList.filter((s) => s.status === SloStatus.BREACHED).length;
    const degradedCount = sloList.filter((s) => s.status === SloStatus.DEGRADED).length;

    const summary: ErrorBudgetSummaryDto = {
      cumulativeConsumptionPercent: cumulativeConsumption,
      tier,
      isFeatureFreezeActive,
      activeFreezeReason,
      evaluationWindowDays: 30,
      slosBreachedCount: breachedCount,
      slosDegradedCount: degradedCount,
      totalSlosMonitored: sloList.length,
      lastUpdated: new Date().toISOString(),
    };

    return {
      summary,
      slos: sloList,
      recentIncidents: [
        {
          id: 'INC-2026-11-01',
          severity: 'SEV-2',
          title: 'Redis Connection Pool Exhaustion during Hayatabad promotion campaign',
          startedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          resolvedAt: new Date(Date.now() - 3600000 * 47.5).toISOString(),
          status: 'RESOLVED',
        },
      ],
    };
  }

  /**
   * Checks whether a feature release freeze is active.
   * Enforces Google SRE error budget release freeze rules.
   */
  isFeatureFreezeActive(): { active: boolean; reason?: string } {
    const overview = this.getReliabilityOverview();
    return {
      active: overview.summary.isFeatureFreezeActive,
      reason: overview.summary.activeFreezeReason,
    };
  }

  /**
   * Simulates or resets the error budget consumption for chaos/staging tests.
   */
  simulateErrorBudget(consumptionPercent: number | null): ErrorBudgetSummaryDto {
    this.simulatedConsumptionOverride = consumptionPercent;
    this.logger.warn(
      `[ReliabilityService] Error budget simulated consumption set to: ${consumptionPercent}%`,
    );
    return this.getReliabilityOverview().summary;
  }

  /**
   * Ingests user feedback across web and mobile platforms.
   */
  recordFeedback(dto: SubmitFeedbackDto, userId?: string): FeedbackItemDto {
    const isNegative = dto.rating <= 2;
    const isPositive = dto.rating >= 4;

    const sentiment = isPositive ? 'POSITIVE' : isNegative ? 'NEGATIVE' : 'NEUTRAL';
    const requiresFollowUp = isNegative;

    const item: FeedbackItemDto = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || 'anonymous',
      persona: dto.persona || 'TENANT',
      rating: dto.rating,
      category: dto.category || FeedbackCategory.GENERAL,
      comment: dto.comment,
      pageUrl: dto.pageUrl,
      locality: dto.locality,
      sentiment,
      createdAt: new Date().toISOString(),
      requiresFollowUp,
    };

    this.feedbackList.unshift(item);

    if (requiresFollowUp) {
      this.logger.warn(
        `[ReliabilityService] URGENT FEEDBACK ALERT: Low rating (${dto.rating}/5) received from ${dto.persona} in ${dto.locality || 'Unknown Locality'}. Reason: "${dto.comment}". Concierge follow-up required.`,
      );
    }

    return item;
  }

  /**
   * Summarizes customer feedback with CSAT, NPS, and sentiment distributions.
   */
  getFeedbackSummary(): FeedbackSummaryDto {
    const totalCount = this.feedbackList.length;
    if (totalCount === 0) {
      return {
        totalCount: 0,
        averageRating: 5.0,
        npsScore: 100,
        categoryCounts: {
          [FeedbackCategory.BUG]: 0,
          [FeedbackCategory.FEATURE_REQUEST]: 0,
          [FeedbackCategory.SEARCH_QUALITY]: 0,
          [FeedbackCategory.LANDLORD_ISSUE]: 0,
          [FeedbackCategory.GENERAL]: 0,
        },
        sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
        recentFeedback: [],
      };
    }

    const ratingSum = this.feedbackList.reduce((acc, f) => acc + f.rating, 0);
    const averageRating = Math.round((ratingSum / totalCount) * 10) / 10;

    // NPS Calculation: (Promoters % - Detractors %)
    // Promoters = 5 stars, Passives = 4 stars, Detractors = 1-3 stars
    const promoters = this.feedbackList.filter((f) => f.rating === 5).length;
    const detractors = this.feedbackList.filter((f) => f.rating <= 3).length;
    const npsScore = Math.round(((promoters - detractors) / totalCount) * 100);

    const categoryCounts: Record<FeedbackCategory, number> = {
      [FeedbackCategory.BUG]: 0,
      [FeedbackCategory.FEATURE_REQUEST]: 0,
      [FeedbackCategory.SEARCH_QUALITY]: 0,
      [FeedbackCategory.LANDLORD_ISSUE]: 0,
      [FeedbackCategory.GENERAL]: 0,
    };

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

    for (const fb of this.feedbackList) {
      if (categoryCounts[fb.category] !== undefined) {
        categoryCounts[fb.category]++;
      }
      if (fb.sentiment === 'POSITIVE') sentimentCounts.positive++;
      else if (fb.sentiment === 'NEGATIVE') sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    }

    return {
      totalCount,
      averageRating,
      npsScore,
      categoryCounts,
      sentimentCounts,
      recentFeedback: this.feedbackList.slice(0, 15),
    };
  }
}
