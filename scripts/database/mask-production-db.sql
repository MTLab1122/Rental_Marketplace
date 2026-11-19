-- =============================================================================
-- Rental Peshawar - Production Data Masking & Pseudonymization Script
-- Requirement: Prevent unmasked PII from entering Staging or Dev environments
-- =============================================================================

BEGIN;

-- 1. Mask User Profiles & Contact Credentials
UPDATE "users"
SET
  "fullName" = 'Test User ' || SUBSTRING("id" FROM 1 FOR 6),
  "email" = 'masked.user.' || SUBSTRING("id" FROM 1 FOR 8) || '@rentalpeshawar.local',
  "phoneNumber" = '+92300000' || LPAD((FLOOR(RANDOM() * 90000 + 10000))::TEXT, 5, '0'),
  "passwordHash" = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr' -- Dummy hash
WHERE "email" NOT LIKE '%@admin.rentalpeshawar.pk';

-- 2. Scramble Landlord Business PII
UPDATE "landlord_profiles"
SET
  "businessName" = 'Rental Landlord ' || SUBSTRING("id" FROM 1 FOR 6),
  "whatsappNumber" = '+92300000' || LPAD((FLOOR(RANDOM() * 90000 + 10000))::TEXT, 5, '0');

-- 3. Redact Identity Verification CNIC Images
UPDATE "verification_records"
SET
  "cnicFrontUrl" = 'https://media.rentalpeshawar.local/samples/sample_cnic_front.jpg',
  "cnicBackUrl" = 'https://media.rentalpeshawar.local/samples/sample_cnic_back.jpg',
  "selfieUrl" = 'https://media.rentalpeshawar.local/samples/sample_selfie.jpg',
  "notes" = 'Redacted for staging/development testing.';

-- 4. Anonymize Private Chat & Dispute Messages
UPDATE "messages"
SET "content" = 'Anonymized chat communication between tenant and landlord.';

UPDATE "dispute_messages"
SET "content" = 'Anonymized dispute evidence text.';

-- 5. Anonymize Audit Logs IP Addresses and User Agents
UPDATE "audit_logs"
SET
  "ipAddress" = '127.0.0.1',
  "userAgent" = 'Mozilla/5.0 (Sanitized Test Agent)';

COMMIT;

