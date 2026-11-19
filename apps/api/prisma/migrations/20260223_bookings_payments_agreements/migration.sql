-- Phase 13 Migration: Bookings, Payments, Agreements, Escrow & Disputes

-- Create Enums
DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'LANDLORD_REVIEWING', 'AWAITING_PAYMENT', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethodType" AS ENUM ('MANUAL_BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'STRIPE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED_BY_TENANT', 'SIGNED_BY_LANDLORD', 'ACTIVE', 'EXPIRED', 'TERMINATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LedgerEntryType" AS ENUM ('DEPOSIT_HOLD', 'DEPOSIT_RELEASE', 'RENT_CHARGE', 'RENT_PAYMENT', 'REFUND', 'PLATFORM_FEE', 'ADJUSTMENT', 'DISPUTE_HOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DisputeCategory" AS ENUM ('PAYMENT_ISSUE', 'PROPERTY_NOT_AS_DESCRIBED', 'DEPOSIT_ISSUE', 'EARLY_TERMINATION', 'SAFETY_ISSUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter NotificationType enum
DO $$ BEGIN
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_STATUS_CHANGED';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AGREEMENT_READY';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DISPUTE_OPENED';
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create BookingRequest table
CREATE TABLE IF NOT EXISTS "booking_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "inquiryId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "tenantCount" INTEGER NOT NULL DEFAULT 1,
    "proposedRentPkr" DECIMAL(12, 2) NOT NULL,
    "proposedDepositPkr" DECIMAL(12, 2) NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_requests_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "booking_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "booking_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "booking_requests_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "booking_requests_tenantId_idx" ON "booking_requests"("tenantId");
CREATE INDEX IF NOT EXISTS "booking_requests_landlordId_idx" ON "booking_requests"("landlordId");
CREATE INDEX IF NOT EXISTS "booking_requests_propertyId_idx" ON "booking_requests"("propertyId");
CREATE INDEX IF NOT EXISTS "booking_requests_status_idx" ON "booking_requests"("status");

-- Create Booking table
CREATE TABLE IF NOT EXISTS "bookings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingRequestId" UUID,
    "inquiryId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "monthlyRentPkr" DECIMAL(12, 2) NOT NULL,
    "securityDepositPkr" DECIMAL(12, 2) NOT NULL,
    "totalInitialAmountPkr" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'PKR',
    "lockExpiresAt" TIMESTAMPTZ(6),
    "confirmedAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bookings_bookingRequestId_key" UNIQUE ("bookingRequestId"),
    CONSTRAINT "bookings_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "bookings_propertyId_status_idx" ON "bookings"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "bookings_tenantId_idx" ON "bookings"("tenantId");
CREATE INDEX IF NOT EXISTS "bookings_landlordId_idx" ON "bookings"("landlordId");
CREATE INDEX IF NOT EXISTS "bookings_lockExpiresAt_idx" ON "bookings"("lockExpiresAt");

-- Create PaymentMethod table
CREATE TABLE IF NOT EXISTS "payment_methods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "accountDetails" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "payment_methods_userId_isActive_idx" ON "payment_methods"("userId", "isActive");

-- Create PaymentIntent table
CREATE TABLE IF NOT EXISTS "payment_intents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amountPkr" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'PKR',
    "paymentMethodType" "PaymentMethodType" NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "clientSecret" VARCHAR(255),
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_intents_idempotencyKey_key" UNIQUE ("idempotencyKey"),
    CONSTRAINT "payment_intents_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "payment_intents_bookingId_idx" ON "payment_intents"("bookingId");
CREATE INDEX IF NOT EXISTS "payment_intents_userId_idx" ON "payment_intents"("userId");

-- Create Payment table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "payerId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "amountPkr" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'PKR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethodType" "PaymentMethodType" NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerTransactionId" VARCHAR(150),
    "idempotencyKey" VARCHAR(128),
    "receiptUrl" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_providerTransactionId_key" UNIQUE ("providerTransactionId"),
    CONSTRAINT "payments_idempotencyKey_key" UNIQUE ("idempotencyKey"),
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "payments_bookingId_idx" ON "payments"("bookingId");
CREATE INDEX IF NOT EXISTS "payments_payerId_idx" ON "payments"("payerId");
CREATE INDEX IF NOT EXISTS "payments_recipientId_idx" ON "payments"("recipientId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- Create Transaction table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paymentId" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "transactionReference" VARCHAR(150) NOT NULL,
    "amountPkr" DECIMAL(12, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "rawPayload" JSONB,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transactions_transactionReference_key" UNIQUE ("transactionReference"),
    CONSTRAINT "transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "transactions_paymentId_idx" ON "transactions"("paymentId");

-- Create Refund table
CREATE TABLE IF NOT EXISTS "refunds" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paymentId" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "amountPkr" DECIMAL(12, 2) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
    "adminId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "refunds_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "refunds_paymentId_idx" ON "refunds"("paymentId");
CREATE INDEX IF NOT EXISTS "refunds_bookingId_idx" ON "refunds"("bookingId");

-- Create Receipt table
CREATE TABLE IF NOT EXISTS "receipts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "paymentId" UUID NOT NULL,
    "receiptNumber" VARCHAR(50) NOT NULL,
    "pdfUrl" VARCHAR(500),
    "issuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "receipts_paymentId_key" UNIQUE ("paymentId"),
    CONSTRAINT "receipts_receiptNumber_key" UNIQUE ("receiptNumber"),
    CONSTRAINT "receipts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create AgreementTemplate table
CREATE TABLE IF NOT EXISTS "agreement_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(150) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentHtml" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agreement_templates_pkey" PRIMARY KEY ("id")
);

-- Create RentalAgreement table
CREATE TABLE IF NOT EXISTS "rental_agreements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "templateId" UUID,
    "title" VARCHAR(150) NOT NULL,
    "termsHtml" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "signedByTenantAt" TIMESTAMPTZ(6),
    "signedByLandlordAt" TIMESTAMPTZ(6),
    "pdfUrl" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rental_agreements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rental_agreements_bookingId_key" UNIQUE ("bookingId"),
    CONSTRAINT "rental_agreements_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rental_agreements_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agreement_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "rental_agreements_bookingId_idx" ON "rental_agreements"("bookingId");
CREATE INDEX IF NOT EXISTS "rental_agreements_status_idx" ON "rental_agreements"("status");

-- Create AgreementSignature table
CREATE TABLE IF NOT EXISTS "agreement_signatures" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agreementId" UUID NOT NULL,
    "signerId" UUID NOT NULL,
    "signerRole" VARCHAR(20) NOT NULL,
    "signerName" VARCHAR(150) NOT NULL,
    "ipAddress" VARCHAR(50),
    "userAgent" VARCHAR(255),
    "signatureHash" VARCHAR(64) NOT NULL,
    "signatureData" TEXT,
    "signedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agreement_signatures_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agreement_signatures_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "rental_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agreement_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "agreement_signatures_agreementId_idx" ON "agreement_signatures"("agreementId");
CREATE INDEX IF NOT EXISTS "agreement_signatures_signerId_idx" ON "agreement_signatures"("signerId");

-- Create Dispute table
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "initiatorId" UUID NOT NULL,
    "respondentId" UUID NOT NULL,
    "category" "DisputeCategory" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "amountDisputedPkr" DECIMAL(12, 2),
    "resolution" TEXT,
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMPTZ(6),
    "evidenceUrls" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "disputes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disputes_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disputes_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disputes_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "disputes_bookingId_idx" ON "disputes"("bookingId");
CREATE INDEX IF NOT EXISTS "disputes_initiatorId_idx" ON "disputes"("initiatorId");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");

-- Create DisputeMessage table
CREATE TABLE IF NOT EXISTS "dispute_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "disputeId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderRole" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentUrls" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dispute_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "dispute_messages_disputeId_idx" ON "dispute_messages"("disputeId");

-- Create LedgerEntry table
CREATE TABLE IF NOT EXISTS "ledger_entries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID,
    "paymentId" UUID,
    "type" "LedgerEntryType" NOT NULL,
    "debitAccount" VARCHAR(50) NOT NULL,
    "creditAccount" VARCHAR(50) NOT NULL,
    "amountPkr" DECIMAL(12, 2) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "isImmutable" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ledger_entries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ledger_entries_bookingId_idx" ON "ledger_entries"("bookingId");
CREATE INDEX IF NOT EXISTS "ledger_entries_paymentId_idx" ON "ledger_entries"("paymentId");
CREATE INDEX IF NOT EXISTS "ledger_entries_type_idx" ON "ledger_entries"("type");
CREATE INDEX IF NOT EXISTS "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");
