-- Phase 12 Migration: Saved Searches, Alerts, Recommendations & Discovery

-- Create Enums
DO $$ BEGIN
    CREATE TYPE "AlertFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AlertDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter NotificationType enum
DO $$ BEGIN
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_LISTING_ALERT';
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create NotificationPreference table
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "pushAlerts" BOOLEAN NOT NULL DEFAULT true,
    "inAppAlerts" BOOLEAN NOT NULL DEFAULT true,
    "instantAlerts" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "recommendations" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_preferences_userId_key" UNIQUE ("userId"),
    CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create SavedSearch table
CREATE TABLE IF NOT EXISTS "saved_searches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "filters" JSONB NOT NULL,
    "filterSignature" VARCHAR(64) NOT NULL,
    "eligibility" "PropertyEligibility",
    "localityId" UUID,
    "propertyType" "PropertyType",
    "minPrice" DECIMAL(12, 2),
    "maxPrice" DECIMAL(12, 2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "furnishing" VARCHAR(50),
    "sortPreference" VARCHAR(50),
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'INSTANT',
    "lastNotifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "saved_searches_userId_idx" ON "saved_searches"("userId");
CREATE INDEX IF NOT EXISTS "saved_searches_filterSignature_idx" ON "saved_searches"("filterSignature");
CREATE INDEX IF NOT EXISTS "saved_searches_alertsEnabled_frequency_idx" ON "saved_searches"("alertsEnabled", "frequency");
CREATE INDEX IF NOT EXISTS "saved_searches_eligibility_localityId_idx" ON "saved_searches"("eligibility", "localityId");

-- Create SearchAlert table
CREATE TABLE IF NOT EXISTS "search_alerts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "savedSearchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "search_alerts_savedSearchId_propertyId_key" UNIQUE ("savedSearchId", "propertyId"),
    CONSTRAINT "search_alerts_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "search_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "search_alerts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "search_alerts_userId_isRead_idx" ON "search_alerts"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "search_alerts_propertyId_idx" ON "search_alerts"("propertyId");

-- Create SearchAlertDelivery table
CREATE TABLE IF NOT EXISTS "search_alert_deliveries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "searchAlertId" UUID NOT NULL,
    "channel" VARCHAR(30) NOT NULL,
    "status" "AlertDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "deliveredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_alert_deliveries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "search_alert_deliveries_searchAlertId_fkey" FOREIGN KEY ("searchAlertId") REFERENCES "search_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "search_alert_deliveries_searchAlertId_channel_idx" ON "search_alert_deliveries"("searchAlertId", "channel");
CREATE INDEX IF NOT EXISTS "search_alert_deliveries_status_idx" ON "search_alert_deliveries"("status");

-- Create RecentlyViewedProperty table
CREATE TABLE IF NOT EXISTS "recently_viewed_properties" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "propertyId" UUID NOT NULL,
    "viewedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dwellTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "source" VARCHAR(50),
    CONSTRAINT "recently_viewed_properties_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recently_viewed_properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recently_viewed_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "recently_viewed_properties_userId_viewedAt_idx" ON "recently_viewed_properties"("userId", "viewedAt");
CREATE INDEX IF NOT EXISTS "recently_viewed_properties_sessionId_viewedAt_idx" ON "recently_viewed_properties"("sessionId", "viewedAt");
CREATE INDEX IF NOT EXISTS "recently_viewed_properties_propertyId_idx" ON "recently_viewed_properties"("propertyId");

-- Create RecommendationEvent table
CREATE TABLE IF NOT EXISTS "recommendation_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "propertyId" UUID NOT NULL,
    "recommendationType" VARCHAR(50) NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "score" DECIMAL(5, 2),
    "action" VARCHAR(50),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recommendation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recommendation_events_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "recommendation_events_userId_recommendationType_idx" ON "recommendation_events"("userId", "recommendationType");
CREATE INDEX IF NOT EXISTS "recommendation_events_propertyId_idx" ON "recommendation_events"("propertyId");
CREATE INDEX IF NOT EXISTS "recommendation_events_createdAt_idx" ON "recommendation_events"("createdAt");

-- Create PropertyImpression table
CREATE TABLE IF NOT EXISTS "property_impressions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "surface" VARCHAR(50) NOT NULL,
    "position" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_impressions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "property_impressions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "property_impressions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "property_impressions_propertyId_createdAt_idx" ON "property_impressions"("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "property_impressions_userId_idx" ON "property_impressions"("userId");
CREATE INDEX IF NOT EXISTS "property_impressions_surface_idx" ON "property_impressions"("surface");

-- Create PropertyClick table
CREATE TABLE IF NOT EXISTS "property_clicks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "surface" VARCHAR(50) NOT NULL,
    "position" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_clicks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "property_clicks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "property_clicks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "property_clicks_propertyId_createdAt_idx" ON "property_clicks"("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "property_clicks_userId_idx" ON "property_clicks"("userId");
CREATE INDEX IF NOT EXISTS "property_clicks_surface_idx" ON "property_clicks"("surface");

-- Create SearchQueryLog table
CREATE TABLE IF NOT EXISTS "search_query_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "sessionId" VARCHAR(100),
    "queryText" VARCHAR(255),
    "filters" JSONB NOT NULL,
    "localityId" UUID,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "search_query_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "search_query_logs_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "localities"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "search_query_logs_userId_idx" ON "search_query_logs"("userId");
CREATE INDEX IF NOT EXISTS "search_query_logs_localityId_idx" ON "search_query_logs"("localityId");
CREATE INDEX IF NOT EXISTS "search_query_logs_createdAt_idx" ON "search_query_logs"("createdAt");

-- Create LocalityDemandSnapshot table
CREATE TABLE IF NOT EXISTS "locality_demand_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "localityId" UUID NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "impressionCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "savedSearchCount" INTEGER NOT NULL DEFAULT 0,
    "averageRentDemand" DECIMAL(12, 2),
    "topPropertyType" "PropertyType",
    "studentDemandRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "locality_demand_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "locality_demand_snapshots_localityId_period_snapshotDate_key" UNIQUE ("localityId", "period", "snapshotDate"),
    CONSTRAINT "locality_demand_snapshots_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "localities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "locality_demand_snapshots_localityId_idx" ON "locality_demand_snapshots"("localityId");
CREATE INDEX IF NOT EXISTS "locality_demand_snapshots_snapshotDate_idx" ON "locality_demand_snapshots"("snapshotDate");
