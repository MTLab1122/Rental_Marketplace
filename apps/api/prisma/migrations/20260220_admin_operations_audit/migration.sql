-- AlterEnum
ALTER TYPE "UserRoleName" ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE "UserRoleName" ADD VALUE IF NOT EXISTS 'SUPPORT';

-- AlterTable User
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaSecret" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isMfaEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable SystemSetting
CREATE TABLE IF NOT EXISTS "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" VARCHAR(255),
    "updatedBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

