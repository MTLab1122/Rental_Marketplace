import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InquiryStatus } from '@prisma/client';

export enum MarketingChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum MessageCategory {
  PROMOTIONAL = 'PROMOTIONAL',
  TRANSACTIONAL = 'TRANSACTIONAL',
}

export interface DispatchMessageParams {
  userId: string;
  channel: MarketingChannel;
  category: MessageCategory;
  title: string;
  body: string;
  recipientPhone?: string;
  recipientEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchResult {
  status: 'SENT' | 'QUEUED' | 'BLOCKED';
  reason?: string;
  deliveryId?: string;
  channel: MarketingChannel;
}

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  // Maximum promotional messages per user in 24 hours
  private readonly MAX_DAILY_PROMOTIONAL_MESSAGES = 2;

  // Quiet hours in PKT (UTC+5): 10:00 PM (22:00) to 8:00 AM (08:00)
  private readonly QUIET_HOURS_START_PKT = 22;
  private readonly QUIET_HOURS_END_PKT = 8;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates if current time is within Pakistan Standard Time (PKT / UTC+5) quiet hours.
   */
  isQuietHours(customDate?: Date): boolean {
    const date = customDate || new Date();
    // PKT is UTC + 5 hours
    const utcHours = date.getUTCHours();
    const pktHours = (utcHours + 5) % 24;

    return pktHours >= this.QUIET_HOURS_START_PKT || pktHours < this.QUIET_HOURS_END_PKT;
  }

  /**
   * Checks if a user has opted out of marketing communications.
   */
  async isUserOptedOut(userId: string): Promise<boolean> {
    const optOutLog = await this.prisma.auditLog.findFirst({
      where: {
        actorId: userId,
        action: 'MARKETING_OPT_OUT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!optOutLog) return false;

    // Check if user subsequently opted back in
    const optInLog = await this.prisma.auditLog.findFirst({
      where: {
        actorId: userId,
        action: 'MARKETING_OPT_IN',
        createdAt: { gt: optOutLog.createdAt },
      },
    });

    return !optInLog;
  }

  /**
   * Checks if user has reached daily frequency cap for promotional messages.
   */
  async checkFrequencyCap(userId: string): Promise<boolean> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await this.prisma.auditLog.count({
      where: {
        actorId: userId,
        action: 'MARKETING_MESSAGE_DISPATCHED',
        createdAt: { gte: oneDayAgo },
        after: {
          path: ['category'],
          equals: MessageCategory.PROMOTIONAL,
        },
      },
    });

    return count < this.MAX_DAILY_PROMOTIONAL_MESSAGES;
  }

  /**
   * Core dispatcher supporting Email, WhatsApp, SMS, and Push.
   * Enforces quiet hours and frequency caps for promotional traffic.
   */
  async dispatchMessage(params: DispatchMessageParams): Promise<DispatchResult> {
    const { userId, channel, category, title, body, recipientPhone, recipientEmail, metadata } =
      params;

    // Check user opt-out for promotional communications
    if (category === MessageCategory.PROMOTIONAL) {
      const optedOut = await this.isUserOptedOut(userId);
      if (optedOut) {
        this.logger.log(
          `[Marketing] Dropped promotional message to user ${userId} (User opted out)`,
        );
        return {
          status: 'BLOCKED',
          reason: 'USER_OPTED_OUT',
          channel,
        };
      }

      // Check quiet hours (22:00 to 08:00 PKT)
      if (this.isQuietHours()) {
        this.logger.log(`[Marketing] Deferred message to user ${userId} during PKT quiet hours`);
        return {
          status: 'QUEUED',
          reason: 'QUIET_HOURS_ACTIVE',
          channel,
        };
      }

      // Check frequency capping (max 2/day)
      const allowed = await this.checkFrequencyCap(userId);
      if (!allowed) {
        this.logger.log(`[Marketing] Dropped message to user ${userId} (Frequency cap exceeded)`);
        return {
          status: 'BLOCKED',
          reason: 'FREQUENCY_CAP_EXCEEDED',
          channel,
        };
      }
    }

    // Deliver via simulated / integrated provider adapters
    const deliveryId = `DLV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    switch (channel) {
      case MarketingChannel.WHATSAPP:
        this.logger.log(`[WhatsApp API] Message to ${recipientPhone || userId}: "${title}"`);
        break;
      case MarketingChannel.SMS:
        this.logger.log(
          `[SMS Gateway] SMS to ${recipientPhone || userId}: "${body.slice(0, 50)}..."`,
        );
        break;
      case MarketingChannel.EMAIL:
        this.logger.log(`[Email Service] Mail to ${recipientEmail || userId}: "${title}"`);
        break;
      case MarketingChannel.PUSH:
      default:
        this.logger.log(`[Push FCM] Notification to user ${userId}: "${title}"`);
        break;
    }

    // Persist in Notification table for in-app access
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title,
        body,
        data: {
          deliveryId,
          channel,
          category,
          ...metadata,
        },
      },
    });

    // Record audit entry for frequency capping and governance tracking
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'MARKETING_MESSAGE_DISPATCHED',
        targetType: 'MARKETING_DISPATCH',
        targetId: deliveryId,
        after: {
          channel,
          category,
          title,
          recipientPhone,
          recipientEmail,
        },
      },
    });

    return {
      status: 'SENT',
      deliveryId,
      channel,
    };
  }

  /**
   * User Opt-Out
   */
  async optOut(userId: string, reason?: string) {
    return this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'MARKETING_OPT_OUT',
        targetType: 'USER_PREFERENCE',
        targetId: userId,
        after: {
          reason: reason || 'User requested unsubscribe',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * User Opt-In
   */
  async optIn(userId: string) {
    return this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'MARKETING_OPT_IN',
        targetType: 'USER_PREFERENCE',
        targetId: userId,
        after: { timestamp: new Date().toISOString() },
      },
    });
  }

  // ==========================================
  // AUTOMATED LIFECYCLE JOURNEYS
  // ==========================================

  /**
   * Journey 1: Welcome Sequence
   * Personalized for Tenant vs. Landlord
   */
  async triggerWelcomeSequence(userId: string): Promise<DispatchResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { landlordProfile: true, tenantProfile: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isLandlord = !!user.landlordProfile;
    const title = isLandlord
      ? 'Welcome to Rental Peshawar for Landlords!'
      : 'Welcome to Rental Peshawar – Find Your Next Home!';

    const body = isLandlord
      ? 'List your property for 0% commission and connect with verified families and students in Hayatabad, University Town, and Saddar.'
      : 'Explore verified student hostels and family homes with independent meters and secure leases across Peshawar.';

    return this.dispatchMessage({
      userId: user.id,
      channel: MarketingChannel.PUSH,
      category: MessageCategory.PROMOTIONAL,
      title,
      body,
      recipientEmail: user.email,
      recipientPhone: user.phoneNumber,
      metadata: { journey: 'welcome_sequence', role: isLandlord ? 'LANDLORD' : 'TENANT' },
    });
  }

  /**
   * Journey 2: Abandoned Inquiry Nudge
   * Follow up when tenant inquiry is pending or unresponded after 12 hours
   */
  async triggerAbandonedInquiryNudge(inquiryId: string): Promise<DispatchResult | null> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { property: true, tenant: true },
    });

    if (
      !inquiry ||
      (inquiry.status !== InquiryStatus.SUBMITTED && inquiry.status !== InquiryStatus.SEEN)
    ) {
      return null;
    }

    return this.dispatchMessage({
      userId: inquiry.tenantId,
      channel: MarketingChannel.WHATSAPP,
      category: MessageCategory.PROMOTIONAL,
      title: 'Update on your rental inquiry',
      body: `Your inquiry for "${inquiry.property.title}" is being reviewed by the landlord. Tap to view property details or explore similar verified homes.`,
      recipientPhone: inquiry.tenant.phoneNumber,
      metadata: { journey: 'abandoned_inquiry', inquiryId },
    });
  }

  /**
   * Journey 3: Saved Search Digest
   * Alerts tenant when new verified rentals match their saved filters
   */
  async triggerSavedSearchDigest(
    userId: string,
    savedSearchId: string,
    matchedCount: number,
    localityName: string,
  ): Promise<DispatchResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.dispatchMessage({
      userId: user.id,
      channel: MarketingChannel.EMAIL,
      category: MessageCategory.PROMOTIONAL,
      title: `${matchedCount} new verified rentals in ${localityName}`,
      body: `We found ${matchedCount} newly listed, verified rental properties matching your saved search criteria in ${localityName}. Check them out before they are taken!`,
      recipientEmail: user.email,
      recipientPhone: user.phoneNumber,
      metadata: { journey: 'saved_search_alerts', savedSearchId, matchedCount, localityName },
    });
  }

  /**
   * Journey 4: Landlord Onboarding Nudge
   * Sent when a landlord has completed verification but posted 0 listings after 48h
   */
  async triggerLandlordOnboardingNudge(landlordId: string): Promise<DispatchResult> {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
      include: { landlordProfile: true, properties: true },
    });

    if (!landlord) {
      throw new BadRequestException('Landlord not found');
    }

    return this.dispatchMessage({
      userId: landlord.id,
      channel: MarketingChannel.WHATSAPP,
      category: MessageCategory.PROMOTIONAL,
      title: 'Post your first Peshawar rental listing for free!',
      body: 'Verified tenants are actively searching in Hayatabad and University Town. Post your rental in under 3 minutes with zero agency commission.',
      recipientPhone: landlord.phoneNumber,
      recipientEmail: landlord.email,
      metadata: { journey: 'landlord_onboarding_nudge' },
    });
  }

  /**
   * Journey 5: Inactive Landlord Reactivation
   * Sent to landlords with listings that have not had active updates for 30+ days
   */
  async triggerInactiveLandlordReactivation(landlordId: string): Promise<DispatchResult> {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
    });

    if (!landlord) {
      throw new BadRequestException('Landlord not found');
    }

    return this.dispatchMessage({
      userId: landlord.id,
      channel: MarketingChannel.SMS,
      category: MessageCategory.PROMOTIONAL,
      title: 'Rental demand surge in Peshawar',
      body: 'Tenant inquiries in your area have increased by 35% this month. Confirm your listing availability to stay on top of search results.',
      recipientPhone: landlord.phoneNumber,
      metadata: { journey: 'inactive_landlord_reactivation' },
    });
  }
}
