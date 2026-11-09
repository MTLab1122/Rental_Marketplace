-- Migration: 20260216_locality_property_search
-- Locality enhancement & Property domain with geospatial validation & search indexes

-- Alter Localities
ALTER TABLE "localities" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "localities" ADD COLUMN IF NOT EXISTS "sort_order" SMALLINT NOT NULL DEFAULT 0;

-- Alter Properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "furnishing" VARCHAR(50);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address_note" VARCHAR(255);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "inquiry_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "favorite_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "suspension_reason" VARCHAR(255);

-- Indexes for performance and search optimization
CREATE INDEX IF NOT EXISTS "properties_status_eligibility_is_available_locality_id_idx" ON "properties"("status", "eligibility", "is_available", "locality_id");
CREATE INDEX IF NOT EXISTS "properties_monthly_rent_pkr_idx" ON "properties"("monthly_rent_pkr");
CREATE INDEX IF NOT EXISTS "properties_bedrooms_property_type_idx" ON "properties"("bedrooms", "property_type");
CREATE INDEX IF NOT EXISTS "properties_created_at_idx" ON "properties"("created_at");

-- Geospatial PostGIS GiST index for radius and proximity queries
CREATE INDEX IF NOT EXISTS "properties_location_gist_idx" ON "properties" USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
