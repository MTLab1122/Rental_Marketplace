-- CreateEnum
CREATE TYPE "ViewSource" AS ENUM ('MOBILE', 'WEB', 'ADMIN_REFERRAL');

-- AlterTable Property
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "availableFromDate" DATE;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "isDuplicateWarning" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "isDuplicateConfirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "duplicateOfPropertyId" UUID;

-- CreateTable PropertyViewEvent
CREATE TABLE IF NOT EXISTS "property_view_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propertyId" UUID NOT NULL,
    "viewerId" UUID,
    "ipHash" VARCHAR(64),
    "source" "ViewSource" NOT NULL DEFAULT 'WEB',
    "localityId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_view_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "property_view_events_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "property_view_events_propertyId_createdAt_idx" ON "property_view_events"("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "property_view_events_propertyId_viewerId_idx" ON "property_view_events"("propertyId", "viewerId");
CREATE INDEX IF NOT EXISTS "property_view_events_propertyId_ipHash_idx" ON "property_view_events"("propertyId", "ipHash");
CREATE INDEX IF NOT EXISTS "property_view_events_propertyId_source_idx" ON "property_view_events"("propertyId", "source");
CREATE INDEX IF NOT EXISTS "property_view_events_localityId_idx" ON "property_view_events"("localityId");

