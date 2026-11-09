-- Migration: 20260217_media_moderation_verification
-- Image moderation, landlord verification, and platform reporting

-- CreateEnums
DO $$ BEGIN
  CREATE TYPE "ReportReason" AS ENUM (
    'FAKE_LISTING',
    'WRONG_LOCATION',
    'MISLEADING_INFORMATION',
    'DISCRIMINATION',
    'HARASSMENT',
    'DUPLICATE_LISTING',
    'UNSAFE_PROPERTY',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ImageModerationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable property_images
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "thumbnail_url" VARCHAR(500);
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "storage_key" VARCHAR(255);
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "moderation_status" "ImageModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "rejection_reason" VARCHAR(255);
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "moderated_by_id" UUID;
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "moderated_at" TIMESTAMPTZ(6);
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "mime_type" VARCHAR(50);
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "file_size_bytes" INTEGER;
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "width" INTEGER;
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "property_images" ADD COLUMN IF NOT EXISTS "checksum" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "property_images_property_id_moderation_status_idx" ON "property_images"("property_id", "moderation_status");

-- AlterTable verification_records
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(150);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR(20);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "cnic_number_hash" VARCHAR(64);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "cnic_number_encrypted" VARCHAR(255);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "cnic_number_masked" VARCHAR(20);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "cnic_front_url" VARCHAR(500);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "cnic_back_url" VARCHAR(500);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "selfie_url" VARCHAR(500);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "address" VARCHAR(255);
ALTER TABLE "verification_records" ADD COLUMN IF NOT EXISTS "review_notes" TEXT;

CREATE INDEX IF NOT EXISTS "verification_records_cnic_number_hash_idx" ON "verification_records"("cnic_number_hash");

-- AlterTable reports
ALTER TABLE "reports" DROP COLUMN IF EXISTS "reason";
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reason" "ReportReason" NOT NULL DEFAULT 'OTHER';

CREATE INDEX IF NOT EXISTS "reports_reporter_id_target_type_target_id_idx" ON "reports"("reporter_id", "target_type", "target_id");

