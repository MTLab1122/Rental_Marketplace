import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateLeadDto,
  UpdateLeadStatusDto,
  LogContactAttemptDto,
  AddLeadNoteDto,
  AssignLeadDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateCampaignVariantDto,
  TrackCampaignTouchDto,
  CreatePromoCodeDto,
  CreatePromotionDto,
  ApplyPromotionDto,
  CreateSubscriptionPlanDto,
  SubscribePlanDto,
  ProcessRefundDto,
  ClaimReferralCodeDto,
  FeatureListingPlacementDto,
  LocalitySponsorshipDto,
} from './monetization.dto';
import {
  LeadStatus,
  LeadSource,
  LeadType,
  PropertyStatus,
  PromotionStatus,
  SubscriptionStatus,
  BillingCycle,
  InvoiceStatus,
  LedgerEntryType,
  RevenueEventType,
} from '@prisma/client';

@Injectable()
export class MonetizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. LEAD MANAGEMENT & CRM
  // ==========================================

  /**
   * Normalizes Pakistani mobile numbers to 923XXXXXXXXX
   */
  normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length === 12) {
      return digits;
    }
    if (digits.startsWith('03') && digits.length === 11) {
      return `92${digits.slice(1)}`;
    }
    if (digits.startsWith('3') && digits.length === 10) {
      return `92${digits}`;
    }
    return digits;
  }

  /**
   * Captures inbound lead with duplicate prevention and campaign attribution
   */
  async createLead(dto: CreateLeadDto, createdById?: string) {
    const normalizedPhone = this.normalizePhoneNumber(dto.phoneNumber);

    // Deduplication Rule: Check if lead with same phone was created in past 45 days
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const existingLead = await this.prisma.lead.findFirst({
      where: {
        normalizedPhone,
        createdAt: { gte: fortyFiveDaysAgo },
      },
    });

    const isDuplicate = !!existingLead;
    const initialStatus = isDuplicate ? LeadStatus.DUPLICATE : LeadStatus.NEW;

    const lead = await this.prisma.lead.create({
      data: {
        fullName: dto.fullName,
        email: dto.email ? dto.email.toLowerCase().trim() : null,
        phoneNumber: dto.phoneNumber,
        normalizedPhone,
        leadType: dto.leadType || LeadType.LANDLORD,
        status: initialStatus,
        source: dto.source || LeadSource.DIRECT,
        localityId: dto.localityId || null,
        propertyCount: dto.propertyCount || 1,
        createdById: createdById || null,
        campaignId: dto.campaignId || null,
        utmSource: dto.utmSource || null,
        utmMedium: dto.utmMedium || null,
        utmCampaign: dto.utmCampaign || null,
        utmContent: dto.utmContent || null,
        notesSummary: dto.notesSummary || null,
        duplicateOfId: existingLead ? existingLead.id : null,
      },
    });

    // Record initial status history audit
    await this.prisma.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        oldStatus: initialStatus,
        newStatus: initialStatus,
        changedById: createdById || null,
        reason: isDuplicate
          ? `Marked duplicate of lead ${existingLead?.id}`
          : 'Lead captured via inbound channel',
      },
    });

    return lead;
  }

  /**
   * Retrieves paginated leads with CRM filters
   */
  async getLeads(params: {
    status?: LeadStatus;
    source?: LeadSource;
    leadType?: LeadType;
    assignedToId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.source) where.source = params.source;
    if (params.leadType) where.leadType = params.leadType;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { normalizedPhone: { contains: params.search } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true } },
          locality: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lead detail view with interactions and audit trail
   */
  async getLeadById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        locality: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true, slug: true } },
        contactAttempts: {
          include: { agent: { select: { id: true, fullName: true } } },
          orderBy: { attemptedAt: 'desc' },
        },
        notes: {
          include: { author: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead '${id}' not found`);
    }

    return lead;
  }

  /**
   * Updates lead status with mandatory audit log
   */
  async updateLeadStatus(id: string, dto: UpdateLeadStatusDto, changedById?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead '${id}' not found`);
    }

    if (lead.status === dto.status) {
      return lead;
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.prisma.leadStatusHistory.create({
      data: {
        leadId: id,
        oldStatus: lead.status,
        newStatus: dto.status,
        changedById: changedById || null,
        reason: dto.reason || `Status updated from ${lead.status} to ${dto.status}`,
      },
    });

    return updated;
  }

  /**
   * Logs a phone or WhatsApp contact attempt by an agent
   */
  async logContactAttempt(leadId: string, dto: LogContactAttemptDto, agentId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException(`Lead '${leadId}' not found`);
    }

    const attempt = await this.prisma.contactAttempt.create({
      data: {
        leadId,
        agentId,
        channel: dto.channel,
        outcome: dto.outcome,
        notes: dto.notes || null,
      },
    });

    // Auto-advance status from NEW to CONTACTED if first connected attempt
    if (lead.status === LeadStatus.NEW && dto.outcome !== 'NO_ANSWER') {
      await this.updateLeadStatus(
        leadId,
        { status: LeadStatus.CONTACTED, reason: `Auto-advanced upon contact via ${dto.channel}` },
        agentId,
      );
    }

    return attempt;
  }

  /**
   * Adds an internal lead note
   */
  async addLeadNote(leadId: string, dto: AddLeadNoteDto, authorId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException(`Lead '${leadId}' not found`);
    }

    return this.prisma.leadNote.create({
      data: {
        leadId,
        authorId,
        content: dto.content,
      },
    });
  }

  /**
   * Assigns lead to an operations agent
   */
  async assignLead(leadId: string, dto: AssignLeadDto, changedById?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException(`Lead '${leadId}' not found`);
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { assignedToId: dto.assignedToId },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: changedById || 'SYSTEM',
        action: 'LEAD_ASSIGNED',
        targetType: 'Lead',
        targetId: leadId,
        after: { assignedToId: dto.assignedToId },
      },
    });

    return updated;
  }

  // ==========================================
  // 2. CAMPAIGN MANAGEMENT & TRACKING
  // ==========================================

  async createCampaign(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        channel: dto.channel,
        status: dto.status || 'DRAFT',
        budgetPkr: dto.budgetPkr || null,
        targetAudience: dto.targetAudience || null,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async getCampaigns() {
    return this.prisma.campaign.findMany({
      include: {
        _count: {
          select: { leads: true, assignments: true, variants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        variants: true,
        _count: { select: { leads: true, assignments: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign '${id}' not found`);
    }

    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        budgetPkr: dto.budgetPkr,
        spentPkr: dto.spentPkr,
      },
    });
  }

  async createCampaignVariant(campaignId: string, dto: CreateCampaignVariantDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new NotFoundException(`Campaign '${campaignId}' not found`);
    }

    return this.prisma.campaignVariant.create({
      data: {
        campaignId,
        name: dto.name,
        utmContent: dto.utmContent,
        targetUrl: dto.targetUrl,
        weight: dto.weight || 50,
      },
    });
  }

  async trackCampaignTouch(dto: TrackCampaignTouchDto, userId?: string) {
    return this.prisma.campaignAssignment.create({
      data: {
        campaignId: dto.campaignId,
        userId: userId || null,
        sessionId: dto.sessionId || null,
        utmSource: dto.utmSource || null,
        utmMedium: dto.utmMedium || null,
        utmCampaign: dto.utmCampaign || null,
        utmContent: dto.utmContent || null,
        touchType: dto.touchType || 'LAST_TOUCH',
      },
    });
  }

  async getCampaignPerformance(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { variants: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign '${campaignId}' not found`);
    }

    const totalLeads = await this.prisma.lead.count({ where: { campaignId } });
    const convertedLeads = await this.prisma.lead.count({
      where: { campaignId, status: LeadStatus.CONVERTED },
    });
    const totalTouches = await this.prisma.campaignAssignment.count({ where: { campaignId } });

    const spent = Number(campaign.spentPkr || 0);
    const costPerLead = totalLeads > 0 ? Math.round(spent / totalLeads) : 0;
    const conversionRate =
      totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0;

    return {
      campaignId: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      budgetPkr: Number(campaign.budgetPkr || 0),
      spentPkr: spent,
      totalTouches,
      totalLeads,
      convertedLeads,
      costPerLeadPkr: costPerLead,
      leadConversionRatePct: conversionRate,
      variants: campaign.variants,
    };
  }

  // ==========================================
  // 3. PROMO CODES & PROMOTIONS
  // ==========================================

  async createPromoCode(dto: CreatePromoCodeDto) {
    return this.prisma.promoCode.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        description: dto.description || null,
        discountPct: dto.discountPct || null,
        discountPkr: dto.discountPkr || null,
        maxRedemptions: dto.maxRedemptions || null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        applicableType: dto.applicableType || null,
      },
    });
  }

  async validatePromoCode(code: string, applicableType?: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promo || !promo.isActive) {
      throw new BadRequestException('Invalid or inactive promo code');
    }

    if (promo.validUntil && new Date() > promo.validUntil) {
      throw new BadRequestException('This promo code has expired');
    }

    if (promo.maxRedemptions && promo.timesRedeemed >= promo.maxRedemptions) {
      throw new BadRequestException('Promo code usage limit has been reached');
    }

    if (applicableType && promo.applicableType && promo.applicableType !== applicableType) {
      throw new BadRequestException(`Promo code is not applicable for ${applicableType}`);
    }

    return promo;
  }

  async createPromotion(dto: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        type: dto.type,
        pricePkr: dto.pricePkr,
        durationDays: dto.durationDays,
        eligibleLocalities: dto.eligibleLocalities ? (dto.eligibleLocalities as any) : undefined,
        eligibleCategory: dto.eligibleCategory || null,
        propertyTypes: dto.propertyTypes ? (dto.propertyTypes as any) : undefined,
        inventoryLimit: dto.inventoryLimit || null,
      },
    });
  }

  async getPromotions() {
    return this.prisma.promotion.findMany({
      where: { status: PromotionStatus.ACTIVE },
      orderBy: { pricePkr: 'asc' },
    });
  }

  async applyPromotion(landlordId: string, dto: ApplyPromotionDto, isAdmin = false) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: dto.promotionId },
    });

    if (!promotion || promotion.status !== PromotionStatus.ACTIVE) {
      throw new NotFoundException('Active promotion package not found');
    }

    // If applied to property, verify ownership, approval status, and availability
    let property: any = null;
    if (dto.propertyId) {
      property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      if (!isAdmin && property.landlordId !== landlordId) {
        throw new ForbiddenException('You can only apply promotions to your own properties');
      }

      // CRITICAL RULE: Promoted listings must be APPROVED and AVAILABLE
      if (property.status !== PropertyStatus.APPROVED || !property.isAvailable) {
        throw new BadRequestException(
          'Promotions can only be applied to APPROVED and AVAILABLE properties. Inactive or draft listings cannot be promoted.',
        );
      }
    }

    // Validate promo code if provided
    let finalPrice = Number(promotion.pricePkr);
    if (dto.promoCode) {
      const promo = await this.validatePromoCode(dto.promoCode, 'PROMOTION');
      if (promo.discountPct) {
        finalPrice = Math.round(finalPrice * (1 - Number(promo.discountPct) / 100));
      } else if (promo.discountPkr) {
        finalPrice = Math.max(0, finalPrice - Number(promo.discountPkr));
      }
      await this.prisma.promoCode.update({
        where: { id: promo.id },
        data: { timesRedeemed: { increment: 1 } },
      });
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + promotion.durationDays);

    const assignment = await this.prisma.promotionAssignment.create({
      data: {
        promotionId: promotion.id,
        propertyId: dto.propertyId || null,
        localityId: dto.localityId || null,
        landlordId,
        startsAt,
        expiresAt,
        isActive: true,
      },
    });

    // Update property featured flag if FEATURED_LISTING
    if (dto.propertyId && promotion.type === 'FEATURED_LISTING') {
      await this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { isFeatured: true },
      });
    }

    // Record financial ledger entry & revenue event
    if (finalPrice > 0) {
      await this.prisma.revenueEvent.create({
        data: {
          type: RevenueEventType.PROMOTION_CHARGE,
          amountPkr: finalPrice,
          sourceId: assignment.id,
          localityId: property?.localityId || dto.localityId || null,
          propertyType: property?.propertyType || null,
          eligibility: property?.eligibility || null,
          metadata: { promotionType: promotion.type, promotionName: promotion.name },
        },
      });

      await this.prisma.ledgerEntry.create({
        data: {
          type: LedgerEntryType.PROMOTION_CHARGE,
          debitAccount: 'ACCOUNTS_RECEIVABLE',
          creditAccount: 'REVENUE_PROMOTIONS',
          amountPkr: finalPrice,
          description: `Promotion charge for ${promotion.name}`,
          metadata: { assignmentId: assignment.id, propertyId: dto.propertyId },
        },
      });
    }

    return {
      assignmentId: assignment.id,
      promotionName: promotion.name,
      propertyId: dto.propertyId,
      expiresAt: expiresAt.toISOString(),
      finalPricePkr: finalPrice,
      isFeatured: true,
      message: 'Promotion successfully activated with transparent prominence label.',
    };
  }

  // ==========================================
  // 4. SUBSCRIPTION PLANS & BILLING
  // ==========================================

  async createSubscriptionPlan(dto: CreateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        description: dto.description || null,
        priceMonthlyPkr: dto.priceMonthlyPkr,
        priceQuarterlyPkr: dto.priceQuarterlyPkr,
        priceYearlyPkr: dto.priceYearlyPkr,
        maxActiveListings: dto.maxActiveListings,
        features: dto.features as any,
      },
    });
  }

  async getSubscriptionPlans() {
    let plans = await this.prisma.subscriptionPlan.findMany({
      where: { isPublic: true },
      orderBy: { priceMonthlyPkr: 'asc' },
    });

    // Seed default tiers if none exist
    if (plans.length === 0) {
      await this.prisma.subscriptionPlan.createMany({
        data: [
          {
            name: 'Free Starter',
            slug: 'free',
            description: 'For private property owners with 1-2 portions.',
            priceMonthlyPkr: 0,
            priceQuarterlyPkr: 0,
            priceYearlyPkr: 0,
            maxActiveListings: 2,
            features: [
              'Up to 2 active listings',
              'Standard 24-48h moderation queue',
              'Direct tenant inquiries',
              'Basic analytics',
            ],
            isPublic: true,
          },
          {
            name: 'Professional Landlord',
            slug: 'pro',
            description: 'For landlords with multiple apartments or family houses.',
            priceMonthlyPkr: 2499,
            priceQuarterlyPkr: 6499,
            priceYearlyPkr: 24990,
            maxActiveListings: 8,
            features: [
              'Up to 8 active listings',
              'Priority moderation (< 4 hours)',
              '1 Free Featured Listing credit/mo',
              'Verified Landlord Trust Badge',
              'Advanced response analytics',
            ],
            isPublic: true,
          },
          {
            name: 'Agency & Hostel Operator',
            slug: 'agency',
            description: 'For student hostel chains and property management agencies.',
            priceMonthlyPkr: 6999,
            priceQuarterlyPkr: 18990,
            priceYearlyPkr: 69990,
            maxActiveListings: 35,
            features: [
              'Up to 35 active listings (150 beds)',
              'Instant certified moderation',
              '4 Free Featured Listing credits/mo',
              'Multi-user agent assignment',
              'CSV property bulk import',
            ],
            isPublic: true,
          },
        ],
      });

      plans = await this.prisma.subscriptionPlan.findMany({
        where: { isPublic: true },
        orderBy: { priceMonthlyPkr: 'asc' },
      });
    }

    return plans;
  }

  async getCurrentSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      // Return default free plan
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: { slug: 'free' },
      });
      return {
        planSlug: 'free',
        planName: freePlan?.name || 'Free Starter',
        maxActiveListings: freePlan?.maxActiveListings || 2,
        status: 'ACTIVE',
        isFreeDefault: true,
      };
    }

    return {
      id: sub.id,
      planSlug: sub.plan.slug,
      planName: sub.plan.name,
      maxActiveListings: sub.plan.maxActiveListings,
      billingCycle: sub.billingCycle,
      status: sub.status,
      currentPeriodEndsAt: sub.currentPeriodEndsAt.toISOString(),
      isFreeDefault: false,
    };
  }

  async subscribeToPlan(userId: string, dto: SubscribePlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${dto.planId}' not found`);
    }

    const billingCycle = dto.billingCycle || BillingCycle.MONTHLY;
    let price = Number(plan.priceMonthlyPkr);
    let durationDays = 30;

    if (billingCycle === BillingCycle.QUARTERLY) {
      price = Number(plan.priceQuarterlyPkr);
      durationDays = 90;
    } else if (billingCycle === BillingCycle.YEARLY) {
      price = Number(plan.priceYearlyPkr);
      durationDays = 365;
    }

    // Cancel any active subscription
    await this.prisma.subscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle,
        currentPeriodStartsAt: startsAt,
        currentPeriodEndsAt: endsAt,
      },
    });

    // Create Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        subscriptionId: subscription.id,
        amountPkr: price,
        taxPkr: Math.round(price * 0.05), // 5% KPRA Service Tax
        totalPkr: Math.round(price * 1.05),
        status: price === 0 ? InvoiceStatus.PAID : InvoiceStatus.ISSUED,
        dueDate: startsAt,
        paidAt: price === 0 ? startsAt : null,
        itemDescription: `${plan.name} Subscription (${billingCycle})`,
        paymentMethod: dto.paymentMethod || (price === 0 ? 'FREE_GRANT' : 'BANK_TRANSFER'),
      },
    });

    if (price > 0) {
      await this.prisma.revenueEvent.create({
        data: {
          type: RevenueEventType.SUBSCRIPTION_CHARGE,
          amountPkr: price,
          sourceId: subscription.id,
          metadata: { planSlug: plan.slug, billingCycle },
        },
      });

      await this.prisma.ledgerEntry.create({
        data: {
          type: LedgerEntryType.SUBSCRIPTION_CHARGE,
          debitAccount: 'ACCOUNTS_RECEIVABLE',
          creditAccount: 'REVENUE_SUBSCRIPTIONS',
          amountPkr: price,
          description: `Subscription charge for ${plan.name} (${billingCycle})`,
          metadata: { subscriptionId: subscription.id, invoiceId: invoice.id },
        },
      });
    }

    return {
      subscriptionId: subscription.id,
      planName: plan.name,
      invoiceNumber: invoice.invoiceNumber,
      totalPkr: Number(invoice.totalPkr),
      status: subscription.status,
      expiresAt: endsAt.toISOString(),
      message: `Successfully subscribed to ${plan.name}.`,
    };
  }

  /**
   * Enforces subscription active listing limits on landlord publishing
   */
  async enforceSubscriptionListingLimit(landlordId: string) {
    const currentSub = await this.getCurrentSubscription(landlordId);
    const maxAllowed = currentSub.maxActiveListings;

    const currentActiveCount = await this.prisma.property.count({
      where: {
        landlordId,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
      },
    });

    if (currentActiveCount >= maxAllowed) {
      throw new ForbiddenException(
        `Active listing limit reached (${currentActiveCount}/${maxAllowed}). Upgrade to Professional or Agency plan to publish more listings simultaneously.`,
      );
    }

    return {
      allowed: true,
      currentActiveCount,
      maxAllowed,
    };
  }

  // ==========================================
  // 5. INVOICING, REFUNDS & REVENUE ANALYTICS
  // ==========================================

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const invoice = await this.prisma.invoice.findFirst({
      where,
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        creditNotes: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice '${id}' not found`);
    }

    return invoice;
  }

  async processRefund(invoiceId: string, dto: ProcessRefundDto, adminId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice '${invoiceId}' not found`);
    }

    if (invoice.status === InvoiceStatus.REFUNDED) {
      throw new BadRequestException('Invoice has already been refunded');
    }

    const refundAmount = dto.amountPkr || Number(invoice.totalPkr);
    const creditNoteNumber = `CRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const creditNote = await this.prisma.creditNote.create({
      data: {
        creditNoteNumber,
        invoiceId,
        amountPkr: refundAmount,
        reason: dto.reason,
      },
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.REFUNDED },
    });

    // Record financial ledger entry
    await this.prisma.ledgerEntry.create({
      data: {
        type: LedgerEntryType.REFUND,
        debitAccount: 'REVENUE_REFUNDS',
        creditAccount: 'CASH_BANK',
        amountPkr: refundAmount,
        description: `Refund processed for invoice ${invoice.invoiceNumber}. Reason: ${dto.reason}`,
        metadata: { invoiceId, creditNoteNumber, adminId },
      },
    });

    await this.prisma.revenueEvent.create({
      data: {
        type: RevenueEventType.REFUND,
        amountPkr: -refundAmount,
        sourceId: invoiceId,
        metadata: { creditNoteNumber, reason: dto.reason },
      },
    });

    return {
      creditNoteNumber: creditNote.creditNoteNumber,
      invoiceNumber: invoice.invoiceNumber,
      refundedAmountPkr: refundAmount,
      status: 'REFUNDED',
      message: 'Refund successfully posted to financial ledger and credit note issued.',
    };
  }

  // ==========================================
  // 6. REFERRALS & ANTI-FRAUD
  // ==========================================

  async claimReferralCode(
    referredUserId: string,
    dto: ClaimReferralCodeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const code = dto.referralCode.toUpperCase().trim();

    // Find referrer from code format PESH-TYPE-USERID6
    // or by matching code on referral table
    const parts = code.split('-');
    const userPrefix = parts.length >= 3 ? parts[2]?.toLowerCase() : null;

    let referrerUser: any = null;
    const existingRef = await this.prisma.referral.findFirst({
      where: { referralCode: code },
    });

    if (existingRef) {
      referrerUser = await this.prisma.user.findFirst({
        where: { id: existingRef.referrerUserId },
      });
    } else if (userPrefix) {
      const candidates = await this.prisma.user.findMany({
        take: 50,
      });
      referrerUser =
        candidates.find(
          (u: any) =>
            u.id.replace(/-/g, '').toLowerCase().startsWith(userPrefix) ||
            u.id.toLowerCase().includes(userPrefix),
        ) || null;
    }

    if (!referrerUser) {
      throw new BadRequestException('Invalid referral code');
    }

    // ANTI-FRAUD RULE 1: Self-Referral Prevention
    if (referrerUser.id === referredUserId) {
      throw new BadRequestException('Self-referrals are strictly prohibited');
    }

    // ANTI-FRAUD RULE 2: Velocity / Sybil Detection
    const recentFromIp = ipAddress
      ? await this.prisma.referral.count({
          where: {
            ipAddress,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        })
      : 0;

    const isFraudFlagged = recentFromIp >= 5;
    const fraudReason = isFraudFlagged ? 'High registration velocity from identical IP' : null;

    const referral = await this.prisma.referral.create({
      data: {
        referrerUserId: referrerUser.id,
        referredUserId,
        referralCode: code,
        referralType: parts[1] || 'TENANT',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        isFraudFlagged,
        fraudReason,
        isQualified: !isFraudFlagged,
        qualifiedAt: !isFraudFlagged ? new Date() : null,
      },
    });

    // Award reward if qualified
    if (!isFraudFlagged) {
      const rewardPkr = parts[1] === 'LANDLORD' ? 1500 : 500;
      await this.prisma.referralReward.create({
        data: {
          referralId: referral.id,
          rewardAmountPkr: rewardPkr,
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });
    }

    return {
      referralId: referral.id,
      isQualified: referral.isQualified,
      isFraudFlagged,
      message: isFraudFlagged
        ? 'Referral queued for operations fraud review.'
        : 'Referral reward successfully verified and credited.',
    };
  }

  // ==========================================
  // 7. COMMERCIAL REVENUE ANALYTICS
  // ==========================================

  async getCommercialOverview() {
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });

    const mrr = activeSubs.reduce((sum, sub) => sum + Number(sub.plan.priceMonthlyPkr), 0);
    const arr = mrr * 12;

    const totalRevenueSum = await this.prisma.revenueEvent.aggregate({
      _sum: { amountPkr: true },
    });

    const totalActiveLeads = await this.prisma.lead.count({
      where: { status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED] } },
    });

    const totalConvertedLeads = await this.prisma.lead.count({
      where: { status: LeadStatus.CONVERTED },
    });

    const totalLeads = await this.prisma.lead.count();
    const leadConversionRate =
      totalLeads > 0 ? Number(((totalConvertedLeads / totalLeads) * 100).toFixed(2)) : 0;

    const activePromotionsCount = await this.prisma.promotionAssignment.count({
      where: { isActive: true, expiresAt: { gte: new Date() } },
    });

    const totalInvoicesPaid = await this.prisma.invoice.count({
      where: { status: InvoiceStatus.PAID },
    });

    // Locality Revenue Breakdown
    const localities = await this.prisma.locality.findMany({
      select: {
        id: true,
        name: true,
        revenueEvents: {
          select: { amountPkr: true },
        },
      },
    });

    const localityRevenueBreakdown = localities.map((loc) => ({
      localityName: loc.name,
      revenuePkr: loc.revenueEvents.reduce((sum, e) => sum + Number(e.amountPkr), 0),
    }));

    return {
      mrrPkr: mrr,
      arrPkr: arr,
      totalRevenuePkr: Number(totalRevenueSum._sum.amountPkr || 0),
      totalActiveSubscribers: activeSubs.length,
      totalActiveLeads,
      leadConversionRate,
      activePromotionsCount,
      totalInvoicesPaid,
      recentTransactionsCount: await this.prisma.revenueEvent.count(),
      localityRevenueBreakdown,
    };
  }

  // ==========================================
  // 8. LEGACY COMPATIBILITY METHODS
  // ==========================================

  async applyFeaturedPlacement(
    landlordId: string,
    dto: FeatureListingPlacementDto,
    isAdmin = false,
  ) {
    const promo = await this.prisma.promotion.findFirst({
      where: { type: 'FEATURED_LISTING' },
    });

    let promoId = promo?.id;
    if (!promoId) {
      const created = await this.prisma.promotion.create({
        data: {
          name: 'Featured Listing Placement',
          slug: 'featured-listing-placement',
          type: 'FEATURED_LISTING',
          pricePkr: 1500,
          durationDays: dto.durationDays,
        },
      });
      promoId = created.id;
    }

    return this.applyPromotion(
      landlordId,
      {
        promotionId: promoId,
        propertyId: dto.propertyId,
        promoCode: dto.voucherCode,
      },
      isAdmin,
    );
  }

  async registerLocalitySponsorship(userId: string, dto: LocalitySponsorshipDto) {
    const promo = await this.prisma.promotion.findFirst({
      where: { type: 'LOCALITY_SPONSORSHIP' },
    });

    let promoId = promo?.id;
    if (!promoId) {
      const created = await this.prisma.promotion.create({
        data: {
          name: 'Locality Exclusive Sponsorship',
          slug: 'locality-sponsorship',
          type: 'LOCALITY_SPONSORSHIP',
          pricePkr: 12000,
          durationDays: 30,
        },
      });
      promoId = created.id;
    }

    return this.applyPromotion(userId, {
      promotionId: promoId,
      localityId: dto.localityId,
      promoCode: dto.voucherCode,
    });
  }
}
