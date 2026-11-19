-- CreateTable: domain_event_outbox
CREATE TABLE IF NOT EXISTS "domain_event_outbox" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "eventType" VARCHAR(100) NOT NULL,
    "aggregateType" VARCHAR(100) NOT NULL,
    "aggregateId" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable: event_store
CREATE TABLE IF NOT EXISTS "event_store" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "eventId" VARCHAR(100) NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "aggregateType" VARCHAR(100) NOT NULL,
    "aggregateId" VARCHAR(100) NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "recordedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable: dead_letter_jobs
CREATE TABLE IF NOT EXISTS "dead_letter_jobs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "jobId" VARCHAR(100) NOT NULL,
    "queueName" VARCHAR(100) NOT NULL,
    "jobName" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "errorReason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "failedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMPTZ(6),
    "resolvedBy" UUID,

    CONSTRAINT "dead_letter_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: daily_analytics_aggregates
CREATE TABLE IF NOT EXISTS "daily_analytics_aggregates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "date" DATE NOT NULL,
    "dimension" VARCHAR(50) NOT NULL,
    "dimensionValue" VARCHAR(100) NOT NULL DEFAULT 'ALL',
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalInquiries" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenuePkr" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "activeListings" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_analytics_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: data_retention_policies
CREATE TABLE IF NOT EXISTS "data_retention_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tableName" VARCHAR(100) NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "archiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "anonymizePii" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "domain_event_outbox_status_nextRetryAt_idx" ON "domain_event_outbox"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "domain_event_outbox_eventType_idx" ON "domain_event_outbox"("eventType");
CREATE INDEX IF NOT EXISTS "domain_event_outbox_aggregateId_idx" ON "domain_event_outbox"("aggregateId");
CREATE INDEX IF NOT EXISTS "domain_event_outbox_createdAt_idx" ON "domain_event_outbox"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "event_store_eventId_key" ON "event_store"("eventId");
CREATE INDEX IF NOT EXISTS "event_store_eventType_occurredAt_idx" ON "event_store"("eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "event_store_aggregateType_aggregateId_idx" ON "event_store"("aggregateType", "aggregateId");
CREATE INDEX IF NOT EXISTS "event_store_occurredAt_idx" ON "event_store"("occurredAt");

CREATE INDEX IF NOT EXISTS "dead_letter_jobs_queueName_isResolved_idx" ON "dead_letter_jobs"("queueName", "isResolved");
CREATE INDEX IF NOT EXISTS "dead_letter_jobs_failedAt_idx" ON "dead_letter_jobs"("failedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "daily_analytics_aggregates_date_dimension_dimensionValue_key" ON "daily_analytics_aggregates"("date", "dimension", "dimensionValue");
CREATE INDEX IF NOT EXISTS "daily_analytics_aggregates_date_idx" ON "daily_analytics_aggregates"("date");

CREATE UNIQUE INDEX IF NOT EXISTS "data_retention_policies_tableName_key" ON "data_retention_policies"("tableName");

