-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REMOVED');
CREATE TYPE "ReviewReportReason" AS ENUM ('SPAM', 'PROFANITY', 'HARASSMENT', 'DEFAMATION', 'CONFLICT_OF_INTEREST', 'OTHER');
CREATE TYPE "ReviewModerationAction" AS ENUM ('APPROVE', 'REJECT', 'HIDE', 'RESTORE', 'REMOVE');
CREATE TYPE "TrustEventType" AS ENUM ('INQUIRY_ACCEPTED', 'INQUIRY_REPLIED', 'REVIEW_RECEIVED', 'REVIEW_REPORTED', 'VERIFICATION_APPROVED', 'BADGE_GRANTED', 'BADGE_REVOKED', 'COMPLAINT_UPHELD');
CREATE TYPE "TrustBadge" AS ENUM ('VERIFIED_LANDLORD', 'FAST_RESPONDER', 'HIGHLY_RATED', 'TOP_LISTING', 'NEW_LISTING', 'PREMIUM_LISTING');

-- CreateTable reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "overallRating" SMALLINT NOT NULL,
    "communicationRating" SMALLINT NOT NULL,
    "accuracyRating" SMALLINT NOT NULL,
    "safetyRating" SMALLINT NOT NULL,
    "valueForMoneyRating" SMALLINT NOT NULL,
    "comment" TEXT NOT NULL,
    "images" JSONB,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "reviews_tenantId_propertyId_inquiryId_key" ON "reviews"("tenantId", "propertyId", "inquiryId");
CREATE INDEX "reviews_propertyId_status_idx" ON "reviews"("propertyId", "status");
CREATE INDEX "reviews_landlordId_status_idx" ON "reviews"("landlordId", "status");
CREATE INDEX "reviews_tenantId_idx" ON "reviews"("tenantId");
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateTable review_replies
CREATE TABLE IF NOT EXISTS "review_replies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reviewId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_replies_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_replies_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "review_replies_reviewId_key" ON "review_replies"("reviewId");
CREATE INDEX "review_replies_landlordId_idx" ON "review_replies"("landlordId");

-- CreateTable review_reports
CREATE TABLE IF NOT EXISTS "review_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reviewId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" "ReviewReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" UUID,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "review_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "review_reports_reviewId_idx" ON "review_reports"("reviewId");
CREATE INDEX "review_reports_reporterId_idx" ON "review_reports"("reporterId");
CREATE INDEX "review_reports_status_idx" ON "review_reports"("status");

-- CreateTable review_moderations
CREATE TABLE IF NOT EXISTS "review_moderations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reviewId" UUID NOT NULL,
    "moderatorId" UUID NOT NULL,
    "action" "ReviewModerationAction" NOT NULL,
    "reason" VARCHAR(255),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_moderations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_moderations_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_moderations_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "review_moderations_reviewId_idx" ON "review_moderations"("reviewId");
CREATE INDEX "review_moderations_moderatorId_idx" ON "review_moderations"("moderatorId");

-- CreateTable landlord_reputation_snapshots
CREATE TABLE IF NOT EXISTS "landlord_reputation_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "landlordId" UUID NOT NULL,
    "averageRating" DECIMAL(3, 2) NOT NULL,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "responseRatePercent" DECIMAL(5, 2) NOT NULL,
    "averageResponseTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "verifiedListingPercent" DECIMAL(5, 2) NOT NULL,
    "inquiryAcceptanceRatePercent" DECIMAL(5, 2) NOT NULL,
    "reviewReportRatePercent" DECIMAL(5, 2) NOT NULL,
    "trustScore" DECIMAL(5, 2) NOT NULL,
    "badges" JSONB,
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landlord_reputation_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "landlord_reputation_snapshots_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "landlord_reputation_snapshots_landlordId_snapshotDate_key" ON "landlord_reputation_snapshots"("landlordId", "snapshotDate");
CREATE INDEX "landlord_reputation_snapshots_landlordId_idx" ON "landlord_reputation_snapshots"("landlordId");
CREATE INDEX "landlord_reputation_snapshots_snapshotDate_idx" ON "landlord_reputation_snapshots"("snapshotDate");

-- CreateTable property_quality_snapshots
CREATE TABLE IF NOT EXISTS "property_quality_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "overallQualityScore" DECIMAL(5, 2) NOT NULL,
    "imageCompletenessScore" DECIMAL(5, 2) NOT NULL,
    "descriptionCompletenessScore" DECIMAL(5, 2) NOT NULL,
    "verifiedLandlordBonus" DECIMAL(5, 2) NOT NULL,
    "reviewRatingScore" DECIMAL(5, 2) NOT NULL,
    "responseRateScore" DECIMAL(5, 2) NOT NULL,
    "complaintPenalty" DECIMAL(5, 2) NOT NULL,
    "freshnessScore" DECIMAL(5, 2) NOT NULL,
    "isPublishReady" BOOLEAN NOT NULL DEFAULT true,
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_quality_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "property_quality_snapshots_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "property_quality_snapshots_propertyId_snapshotDate_key" ON "property_quality_snapshots"("propertyId", "snapshotDate");
CREATE INDEX "property_quality_snapshots_propertyId_idx" ON "property_quality_snapshots"("propertyId");
CREATE INDEX "property_quality_snapshots_snapshotDate_idx" ON "property_quality_snapshots"("snapshotDate");

-- CreateTable trust_events
CREATE TABLE IF NOT EXISTS "trust_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "eventType" "TrustEventType" NOT NULL,
    "impactDelta" DECIMAL(5, 2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trust_events_entityType_entityId_idx" ON "trust_events"("entityType", "entityId");
CREATE INDEX "trust_events_eventType_idx" ON "trust_events"("eventType");
CREATE INDEX "trust_events_createdAt_idx" ON "trust_events"("createdAt");

-- CreateTable trust_score_history
CREATE TABLE IF NOT EXISTS "trust_score_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "scoreBefore" DECIMAL(5, 2) NOT NULL,
    "scoreAfter" DECIMAL(5, 2) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "calculatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_score_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trust_score_history_entityType_entityId_idx" ON "trust_score_history"("entityType", "entityId");
CREATE INDEX "trust_score_history_calculatedAt_idx" ON "trust_score_history"("calculatedAt");

