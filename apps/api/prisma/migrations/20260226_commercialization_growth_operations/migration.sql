-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'CONVERTED', 'LOST', 'INVALID', 'DUPLICATE');
CREATE TYPE "LeadSource" AS ENUM ('ORGANIC_SEARCH', 'DIRECT', 'REFERRAL', 'GOOGLE_ADS', 'META_ADS', 'TIKTOK_ADS', 'WHATSAPP', 'FACEBOOK_GROUP', 'UNIVERSITY_PARTNER', 'LANDLORD_REFERRAL', 'OFFLINE', 'OTHER');
CREATE TYPE "LeadType" AS ENUM ('LANDLORD', 'TENANT', 'AGENCY_HOSTEL');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "PromotionType" AS ENUM ('FEATURED_LISTING', 'TOP_SEARCH_PLACEMENT', 'LOCALITY_SPONSORSHIP', 'VERIFIED_LANDLORD_BADGE', 'LEAD_BOOST', 'DISCOUNT');
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID', 'REFUNDED');
CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED', 'CLAWED_BACK');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "RevenueEventType" AS ENUM ('SUBSCRIPTION_CHARGE', 'PROMOTION_CHARGE', 'REFUND', 'CREDIT', 'PLATFORM_FEE', 'ADJUSTMENT');

-- AlterEnum
ALTER TYPE "LedgerEntryType" ADD VALUE 'SUBSCRIPTION_CHARGE';
ALTER TYPE "LedgerEntryType" ADD VALUE 'PROMOTION_CHARGE';
ALTER TYPE "LedgerEntryType" ADD VALUE 'CREDIT';

-- CreateTable leads
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "phoneNumber" VARCHAR(20) NOT NULL,
    "normalizedPhone" VARCHAR(20) NOT NULL,
    "leadType" "LeadType" NOT NULL DEFAULT 'LANDLORD',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'DIRECT',
    "localityId" UUID,
    "propertyCount" INTEGER DEFAULT 1,
    "assignedToId" UUID,
    "createdById" UUID,
    "campaignId" UUID,
    "utmSource" VARCHAR(100),
    "utmMedium" VARCHAR(100),
    "utmCampaign" VARCHAR(150),
    "utmContent" VARCHAR(150),
    "notesSummary" TEXT,
    "duplicateOfId" UUID,
    "convertedUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable contact_attempts
CREATE TABLE "contact_attempts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "outcome" VARCHAR(100) NOT NULL,
    "notes" TEXT,
    "attemptedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable lead_notes
CREATE TABLE "lead_notes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable lead_status_history
CREATE TABLE "lead_status_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL,
    "oldStatus" "LeadStatus" NOT NULL,
    "newStatus" "LeadStatus" NOT NULL,
    "changedById" UUID,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable campaigns
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budgetPkr" DECIMAL(12,2),
    "spentPkr" DECIMAL(12,2) DEFAULT 0,
    "targetAudience" VARCHAR(100),
    "utmSource" VARCHAR(100) NOT NULL,
    "utmMedium" VARCHAR(100) NOT NULL,
    "utmCampaign" VARCHAR(150) NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable campaign_variants
CREATE TABLE "campaign_variants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "campaignId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "utmContent" VARCHAR(150) NOT NULL,
    "targetUrl" VARCHAR(255) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable campaign_assignments
CREATE TABLE "campaign_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "campaignId" UUID NOT NULL,
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "utmSource" VARCHAR(100),
    "utmMedium" VARCHAR(100),
    "utmCampaign" VARCHAR(150),
    "utmContent" VARCHAR(150),
    "touchType" VARCHAR(20) NOT NULL DEFAULT 'LAST_TOUCH',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable promo_codes
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "discountPct" DECIMAL(5,2),
    "discountPkr" DECIMAL(10,2),
    "maxRedemptions" INTEGER,
    "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableType" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable promotions
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "type" "PromotionType" NOT NULL,
    "pricePkr" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "eligibleLocalities" JSONB,
    "eligibleCategory" VARCHAR(50),
    "propertyTypes" JSONB,
    "inventoryLimit" INTEGER,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable promotion_assignments
CREATE TABLE "promotion_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "promotionId" UUID NOT NULL,
    "propertyId" UUID,
    "localityId" UUID,
    "landlordId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable subscription_plans
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priceMonthlyPkr" DECIMAL(10,2) NOT NULL,
    "priceQuarterlyPkr" DECIMAL(10,2) NOT NULL,
    "priceYearlyPkr" DECIMAL(10,2) NOT NULL,
    "maxActiveListings" INTEGER NOT NULL DEFAULT 3,
    "features" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable subscriptions
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStartsAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEndsAt" TIMESTAMPTZ(6) NOT NULL,
    "cancelledAt" TIMESTAMPTZ(6),
    "cancellationReason" VARCHAR(255),
    "renewalAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable invoices
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "userId" UUID NOT NULL,
    "subscriptionId" UUID,
    "amountPkr" DECIMAL(12,2) NOT NULL,
    "taxPkr" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPkr" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "dueDate" DATE NOT NULL,
    "paidAt" TIMESTAMPTZ(6),
    "itemDescription" VARCHAR(255) NOT NULL,
    "paymentMethod" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable credit_notes
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "creditNoteNumber" VARCHAR(50) NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amountPkr" DECIMAL(12,2) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable referrals
CREATE TABLE "referrals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "referrerUserId" UUID NOT NULL,
    "referredUserId" UUID,
    "referralCode" VARCHAR(50) NOT NULL,
    "referralType" VARCHAR(20) NOT NULL DEFAULT 'TENANT',
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "isFraudFlagged" BOOLEAN NOT NULL DEFAULT false,
    "fraudReason" VARCHAR(255),
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable referral_rewards
CREATE TABLE "referral_rewards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "referralId" UUID NOT NULL,
    "rewardAmountPkr" DECIMAL(10,2) NOT NULL,
    "rewardType" VARCHAR(50) NOT NULL DEFAULT 'WALLET_CREDIT',
    "status" "ReferralRewardStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMPTZ(6),
    "paidAt" TIMESTAMPTZ(6),
    "clawbackAt" TIMESTAMPTZ(6),
    "clawbackReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable payouts
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "amountPkr" DECIMAL(12,2) NOT NULL,
    "payoutMethod" VARCHAR(50) NOT NULL,
    "accountNumber" VARCHAR(50) NOT NULL,
    "accountTitle" VARCHAR(100) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNumber" VARCHAR(100),
    "notes" TEXT,
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable revenue_events
CREATE TABLE "revenue_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "RevenueEventType" NOT NULL,
    "amountPkr" DECIMAL(12,2) NOT NULL,
    "sourceId" VARCHAR(100),
    "localityId" UUID,
    "propertyType" "PropertyType",
    "eligibility" "PropertyEligibility",
    "metadata" JSONB,
    "recordedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id")
);

-- Create Indexes
CREATE INDEX "leads_normalizedPhone_idx" ON "leads"("normalizedPhone");
CREATE INDEX "leads_email_idx" ON "leads"("email");
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_source_idx" ON "leads"("source");
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");
CREATE INDEX "leads_campaignId_idx" ON "leads"("campaignId");

CREATE INDEX "campaigns_slug_idx" ON "campaigns"("slug");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

CREATE INDEX "promotions_slug_idx" ON "promotions"("slug");
CREATE INDEX "promotions_type_idx" ON "promotions"("type");

CREATE INDEX "promotion_assignments_promotionId_idx" ON "promotion_assignments"("promotionId");
CREATE INDEX "promotion_assignments_propertyId_idx" ON "promotion_assignments"("propertyId");
CREATE INDEX "promotion_assignments_landlordId_idx" ON "promotion_assignments"("landlordId");
CREATE INDEX "promotion_assignments_isActive_expiresAt_idx" ON "promotion_assignments"("isActive", "expiresAt");

CREATE INDEX "subscription_plans_slug_idx" ON "subscription_plans"("slug");
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

CREATE INDEX "referrals_referralCode_idx" ON "referrals"("referralCode");
CREATE INDEX "referrals_referrerUserId_idx" ON "referrals"("referrerUserId");
CREATE INDEX "referrals_referredUserId_idx" ON "referrals"("referredUserId");

CREATE INDEX "revenue_events_type_idx" ON "revenue_events"("type");
CREATE INDEX "revenue_events_recordedAt_idx" ON "revenue_events"("recordedAt");
CREATE INDEX "revenue_events_localityId_idx" ON "revenue_events"("localityId");
