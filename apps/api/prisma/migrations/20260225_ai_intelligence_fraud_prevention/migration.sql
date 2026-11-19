-- CreateTable
CREATE TABLE "listing_quality_suggestions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "suggestionType" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "actionableStep" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "modelVersion" VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "listing_quality_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_embeddings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "embedding" JSONB NOT NULL,
    "dimensions" INTEGER NOT NULL DEFAULT 384,
    "modelVersion" VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "property_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "riskScore" DECIMAL(5,2) NOT NULL,
    "riskLevel" VARCHAR(20) NOT NULL,
    "signals" JSONB NOT NULL,
    "decision" VARCHAR(50) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMPTZ(6),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_moderation_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contentType" VARCHAR(20) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "flag" VARCHAR(50) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "actionTaken" VARCHAR(50) NOT NULL,
    "reviewerAction" VARCHAR(50),
    "reviewerId" UUID,
    "reviewedAt" TIMESTAMPTZ(6),
    "modelVersion" VARCHAR(50) NOT NULL DEFAULT 'moderation-v1',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_moderation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locality_pricing_insights" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "localityId" UUID NOT NULL,
    "propertyType" VARCHAR(50) NOT NULL,
    "bedrooms" SMALLINT NOT NULL DEFAULT 1,
    "medianRentPkr" DECIMAL(12,2) NOT NULL,
    "percentile25Pkr" DECIMAL(12,2) NOT NULL,
    "percentile75Pkr" DECIMAL(12,2) NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "locality_pricing_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_intelligence_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "snapshotDate" DATE NOT NULL,
    "localityId" UUID,
    "demandIndex" DECIMAL(6,2) NOT NULL,
    "supplyDemandRatio" DECIMAL(6,2) NOT NULL,
    "avgDaysToInquiry" DECIMAL(6,2) NOT NULL,
    "avgDaysToBooking" DECIMAL(6,2) NOT NULL,
    "searchToInquiryConversion" DECIMAL(5,4) NOT NULL,
    "inquiryToBookingConversion" DECIMAL(5,4) NOT NULL,
    "landlordResponseRate" DECIMAL(5,4) NOT NULL,
    "metrics" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_intelligence_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_quality_suggestions_propertyId_status_idx" ON "listing_quality_suggestions"("propertyId", "status");
CREATE INDEX "listing_quality_suggestions_suggestionType_idx" ON "listing_quality_suggestions"("suggestionType");

-- CreateIndex
CREATE UNIQUE INDEX "property_embeddings_propertyId_key" ON "property_embeddings"("propertyId");

-- CreateIndex
CREATE INDEX "risk_assessments_entityType_entityId_idx" ON "risk_assessments"("entityType", "entityId");
CREATE INDEX "risk_assessments_riskLevel_isResolved_idx" ON "risk_assessments"("riskLevel", "isResolved");
CREATE INDEX "risk_assessments_createdAt_idx" ON "risk_assessments"("createdAt");

-- CreateIndex
CREATE INDEX "content_moderation_records_entityType_entityId_idx" ON "content_moderation_records"("entityType", "entityId");
CREATE INDEX "content_moderation_records_flag_actionTaken_idx" ON "content_moderation_records"("flag", "actionTaken");
CREATE INDEX "content_moderation_records_createdAt_idx" ON "content_moderation_records"("createdAt");

-- CreateIndex
CREATE INDEX "locality_pricing_insights_localityId_idx" ON "locality_pricing_insights"("localityId");
CREATE UNIQUE INDEX "locality_pricing_insights_localityId_propertyType_bedrooms_key" ON "locality_pricing_insights"("localityId", "propertyType", "bedrooms");

-- CreateIndex
CREATE INDEX "marketplace_intelligence_snapshots_snapshotDate_idx" ON "marketplace_intelligence_snapshots"("snapshotDate");
CREATE INDEX "marketplace_intelligence_snapshots_localityId_idx" ON "marketplace_intelligence_snapshots"("localityId");
CREATE UNIQUE INDEX "marketplace_intelligence_snapshots_snapshotDate_localityId_key" ON "marketplace_intelligence_snapshots"("snapshotDate", "localityId");

-- AddForeignKey
ALTER TABLE "listing_quality_suggestions" ADD CONSTRAINT "listing_quality_suggestions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_embeddings" ADD CONSTRAINT "property_embeddings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locality_pricing_insights" ADD CONSTRAINT "locality_pricing_insights_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "localities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
