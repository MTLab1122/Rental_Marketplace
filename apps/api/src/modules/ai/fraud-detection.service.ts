import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RiskEntityType, RiskLevel } from '@rental-peshawar/shared-types';

export interface SignalContribution {
  ruleName: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreContribution: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates fraud and integrity risk for a Property listing.
   * High-risk listings automatically transition to requires admin review.
   */
  async evaluatePropertyRisk(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        landlord: {
          include: {
            verificationRecords: true,
          },
        },
        locality: true,
        images: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const signals: SignalContribution[] = [];
    let totalScore = 0;

    // 1. Landlord Verification Signal
    const isVerified =
      property.landlord?.isVerified ||
      property.landlord?.verificationRecords?.some((r) => r.status === 'VERIFIED');
    if (!isVerified) {
      signals.push({
        ruleName: 'UNVERIFIED_LANDLORD',
        description: 'Listing published by an unverified landlord profile',
        severity: 'MEDIUM',
        scoreContribution: 25,
      });
      totalScore += 25;
    }

    // 2. Account Age Signal
    const landlordAgeDays =
      (Date.now() - new Date(property.landlord.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (landlordAgeDays < 2) {
      signals.push({
        ruleName: 'NEW_ACCOUNT_VELOCITY',
        description: 'Landlord registered less than 48 hours ago',
        severity: 'MEDIUM',
        scoreContribution: 20,
      });
      totalScore += 20;
    }

    // 3. Rapid Listing Creation Signal
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentListingsCount = await this.prisma.property.count({
      where: {
        landlordId: property.landlordId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentListingsCount >= 4) {
      signals.push({
        ruleName: 'RAPID_LISTING_SPAM',
        description: `Landlord submitted ${recentListingsCount} listings in the last 60 minutes`,
        severity: 'HIGH',
        scoreContribution: 30,
      });
      totalScore += 30;
    }

    // 4. Duplicate Listing / Image Reuse Check
    const duplicateListings = await this.prisma.property.count({
      where: {
        id: { not: property.id },
        title: { equals: property.title, mode: 'insensitive' },
        localityId: property.localityId,
        status: { in: ['APPROVED', 'PENDING_REVIEW'] },
      },
    });

    if (duplicateListings > 0) {
      signals.push({
        ruleName: 'DUPLICATE_LISTING_COLLISION',
        description: `Found ${duplicateListings} existing active listing(s) with identical title and locality`,
        severity: 'HIGH',
        scoreContribution: 35,
      });
      totalScore += 35;
    }

    // 5. Price Outlier Signal
    const rent = Number(property.monthlyRentPkr);
    if (rent < 3000) {
      signals.push({
        ruleName: 'SUSPICIOUS_LOW_PRICE',
        description: `Monthly rent PKR ${rent} is implausibly low for Peshawar municipal area`,
        severity: 'HIGH',
        scoreContribution: 30,
      });
      totalScore += 30;
    }

    // 6. Report History
    const reportsCount = await this.prisma.report.count({
      where: {
        targetId: property.landlordId,
        status: { in: ['OPEN', 'UNDER_INVESTIGATION'] as any },
      },
    });
    if (reportsCount > 0) {
      signals.push({
        ruleName: 'PREVIOUS_REPORT_HISTORY',
        description: `Landlord has ${reportsCount} open user complaints/reports on record`,
        severity: 'HIGH',
        scoreContribution: Math.min(reportsCount * 15, 30),
      });
      totalScore += Math.min(reportsCount * 15, 30);
    }

    // Determine Risk Level & Automated Action
    const riskScore = Math.min(100, Math.max(0, totalScore));
    let riskLevel: RiskLevel = RiskLevel.LOW;
    let decision = 'AUTO_APPROVED_RISK_CHECK';

    if (riskScore >= 80) {
      riskLevel = RiskLevel.CRITICAL;
      decision = 'REQUIRES_IMMEDIATE_ADMIN_REVIEW';
    } else if (riskScore >= 55) {
      riskLevel = RiskLevel.HIGH;
      decision = 'FLAGGED_FOR_MANUAL_REVIEW';
    } else if (riskScore >= 30) {
      riskLevel = RiskLevel.MEDIUM;
      decision = 'STANDARD_MONITORING';
    }

    // Save Risk Assessment Record
    const assessment = await this.prisma.riskAssessment.create({
      data: {
        entityType: RiskEntityType.PROPERTY,
        entityId: property.id,
        riskScore,
        riskLevel,
        signals: signals as any,
        decision,
        isResolved: riskLevel === RiskLevel.LOW,
      },
    });

    this.logger.log(
      `[Fraud Detection] Property ${property.id} evaluated. Score: ${riskScore} (${riskLevel}). Action: ${decision}`,
    );

    return assessment;
  }

  /**
   * Evaluates fraud risk for a User / Landlord profile.
   */
  async evaluateUserRisk(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        verificationRecords: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const signals: SignalContribution[] = [];
    let totalScore = 0;

    // 1. Disposable / Suspicious Email
    if (user.email && /tempmail|throwaway|guerrillamail|10minutemail/i.test(user.email)) {
      signals.push({
        ruleName: 'DISPOSABLE_EMAIL',
        description: 'User registered with a disposable temporary email domain',
        severity: 'CRITICAL',
        scoreContribution: 45,
      });
      totalScore += 45;
    }

    // 2. Unverified Status
    const isVerified =
      user.isVerified || user.verificationRecords?.some((r) => r.status === 'VERIFIED');
    if (!isVerified) {
      signals.push({
        ruleName: 'UNVERIFIED_IDENTITY',
        description: 'Account lacks verified CNIC and identity documentation',
        severity: 'LOW',
        scoreContribution: 15,
      });
      totalScore += 15;
    }

    // 3. User Reports
    const openReportsCount = await this.prisma.report.count({
      where: {
        targetId: user.id,
        status: { in: ['OPEN', 'UNDER_INVESTIGATION'] as any },
      },
    });
    if (openReportsCount >= 2) {
      signals.push({
        ruleName: 'MULTIPLE_OPEN_COMPLAINTS',
        description: `Account has ${openReportsCount} pending fraud or misconduct complaints`,
        severity: 'HIGH',
        scoreContribution: 35,
      });
      totalScore += 35;
    }

    const riskScore = Math.min(100, Math.max(0, totalScore));
    let riskLevel = RiskLevel.LOW;
    let decision = 'ALLOW_ACTIVITY';

    if (riskScore >= 80) {
      riskLevel = RiskLevel.CRITICAL;
      decision = 'RESTRICT_ACCOUNT_PENDING_REVIEW';
    } else if (riskScore >= 50) {
      riskLevel = RiskLevel.HIGH;
      decision = 'REQUIRE_ADMIN_CLEARANCE';
    } else if (riskScore >= 25) {
      riskLevel = RiskLevel.MEDIUM;
      decision = 'ENHANCED_AUDIT';
    }

    const assessment = await this.prisma.riskAssessment.create({
      data: {
        entityType: RiskEntityType.USER,
        entityId: user.id,
        riskScore,
        riskLevel,
        signals: signals as any,
        decision,
        isResolved: riskLevel === RiskLevel.LOW,
      },
    });

    return assessment;
  }

  /**
   * Retrieves risk assessments for administrative inspection.
   */
  async getRiskEntities(params: {
    entityType?: RiskEntityType;
    riskLevel?: RiskLevel;
    isResolved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { entityType, riskLevel, isResolved, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (riskLevel) where.riskLevel = riskLevel;
    if (isResolved !== undefined) where.isResolved = isResolved;

    const [total, assessments] = await Promise.all([
      this.prisma.riskAssessment.count({ where }),
      this.prisma.riskAssessment.findMany({
        where,
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assessments,
    };
  }

  /**
   * Retrieves specific entity risk history.
   */
  async getEntityRisk(entityType: string, entityId: string) {
    const assessments = await this.prisma.riskAssessment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    if (assessments.length === 0) {
      // If no assessment exists yet, run an on-demand evaluation
      if (entityType === RiskEntityType.PROPERTY) {
        const created = await this.evaluatePropertyRisk(entityId);
        return [created];
      }
      if (entityType === RiskEntityType.USER) {
        const created = await this.evaluateUserRisk(entityId);
        return [created];
      }
    }

    return assessments;
  }

  /**
   * Admin resolution of a risk flag.
   */
  async reviewRiskEntity(
    entityType: string,
    entityId: string,
    adminId: string,
    dto: { isResolved: boolean; decision: string; resolutionNotes?: string },
  ) {
    const latest = await this.prisma.riskAssessment.findFirst({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      throw new NotFoundException(`No risk assessment found for ${entityType} ${entityId}`);
    }

    const updated = await this.prisma.riskAssessment.update({
      where: { id: latest.id },
      data: {
        isResolved: dto.isResolved,
        decision: dto.decision,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolutionNotes: dto.resolutionNotes,
      },
    });

    this.logger.log(
      `[Admin Risk Review] ${entityType} ${entityId} reviewed by ${adminId}. New decision: ${dto.decision}`,
    );

    return updated;
  }
}
