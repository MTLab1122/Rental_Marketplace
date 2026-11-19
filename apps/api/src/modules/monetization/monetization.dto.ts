import { IsString, IsOptional, IsNumber, Min, IsEnum, IsEmail, IsArray } from 'class-validator';
import {
  LeadStatus,
  LeadSource,
  LeadType,
  CampaignStatus,
  PromotionType,
  BillingCycle,
} from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phoneNumber!: string;

  @IsOptional()
  @IsEnum(LeadType)
  leadType?: LeadType;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsNumber()
  propertyCount?: number;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmContent?: string;

  @IsOptional()
  @IsString()
  notesSummary?: string;
}

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class LogContactAttemptDto {
  @IsString()
  channel!: string; // PHONE, WHATSAPP, EMAIL, IN_PERSON

  @IsString()
  outcome!: string; // CONNECTED, NO_ANSWER, CALLBACK_REQUESTED, NOT_INTERESTED

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddLeadNoteDto {
  @IsString()
  content!: string;
}

export class AssignLeadDto {
  @IsString()
  assignedToId!: string;
}

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsNumber()
  budgetPkr?: number;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsString()
  utmSource!: string;

  @IsString()
  utmMedium!: string;

  @IsString()
  utmCampaign!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsNumber()
  budgetPkr?: number;

  @IsOptional()
  @IsNumber()
  spentPkr?: number;
}

export class CreateCampaignVariantDto {
  @IsString()
  name!: string;

  @IsString()
  utmContent!: string;

  @IsString()
  targetUrl!: string;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class TrackCampaignTouchDto {
  @IsString()
  campaignId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmContent?: string;

  @IsOptional()
  @IsString()
  touchType?: string; // FIRST_TOUCH or LAST_TOUCH
}

export class CreatePromoCodeDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  discountPct?: number;

  @IsOptional()
  @IsNumber()
  discountPkr?: number;

  @IsOptional()
  @IsNumber()
  maxRedemptions?: number;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  applicableType?: string;
}

export class ApplyPromoCodeDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  applicableType?: string;
}

export class CreatePromotionDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsNumber()
  @Min(0)
  pricePkr!: number;

  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsOptional()
  @IsArray()
  eligibleLocalities?: string[];

  @IsOptional()
  @IsString()
  eligibleCategory?: string;

  @IsOptional()
  @IsArray()
  propertyTypes?: string[];

  @IsOptional()
  @IsNumber()
  inventoryLimit?: number;
}

export class ApplyPromotionDto {
  @IsString()
  promotionId!: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class CreateSubscriptionPlanDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  priceMonthlyPkr!: number;

  @IsNumber()
  priceQuarterlyPkr!: number;

  @IsNumber()
  priceYearlyPkr!: number;

  @IsNumber()
  maxActiveListings!: number;

  @IsArray()
  features!: string[];
}

export class SubscribePlanDto {
  @IsString()
  planId!: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class ProcessRefundDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsNumber()
  amountPkr?: number;
}

export class ClaimReferralCodeDto {
  @IsString()
  referralCode!: string;
}

export class FeatureListingPlacementDto {
  @IsString()
  propertyId!: string;

  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}

export class LocalitySponsorshipDto {
  @IsString()
  localityId!: string;

  @IsString()
  sponsorName!: string;

  @IsString()
  bannerText!: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
