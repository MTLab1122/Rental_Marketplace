-- Migration: 20260218_inquiries_messaging_notifications
-- Real-time messaging, conversations, inquiries status transitions, WhatsApp contact, blocking and notifications

-- AlterTable landlord_profiles
ALTER TABLE "landlord_profiles" ADD COLUMN IF NOT EXISTS "whatsapp_number" VARCHAR(20);
ALTER TABLE "landlord_profiles" ADD COLUMN IF NOT EXISTS "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "whatsapp_number" VARCHAR(20);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "show_whatsapp" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable inquiries
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "proposed_rent_pkr" INTEGER;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "preferred_contact_method" VARCHAR(20) DEFAULT 'IN_APP';

-- AlterTable conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "inquiry_id" UUID UNIQUE;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "is_blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "blocked_by_id" UUID;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMPTZ(6);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Foreign Keys for conversations
DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_blocked_by_id_fkey" FOREIGN KEY ("blocked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "conversations_inquiry_id_idx" ON "conversations"("inquiry_id");
CREATE INDEX IF NOT EXISTS "conversations_property_id_idx" ON "conversations"("property_id");
CREATE INDEX IF NOT EXISTS "conversations_is_blocked_idx" ON "conversations"("is_blocked");

-- AlterTable messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMPTZ(6);

