-- =============================================================================
-- Rental Peshawar - Least-Privilege Database Role Configuration
-- CIS PostgreSQL 16 Benchmark & NIST SP 800-53 Compliance
-- =============================================================================

-- Ensure extensions exist in the primary database
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. APPLICATION RUNTIME USER (CRUD Only, No DDL, No Superuser)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'AppUserSecurePass2026!ReplaceInVault';
  END IF;
END $$;

-- Grant minimal connect and schema usage
GRANT CONNECT ON DATABASE rental_peshawar_prod TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant DML (Data Manipulation) only on all existing and future tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Revoke dangerous table alteration privileges from application user
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM app_user;

-- -----------------------------------------------------------------------------
-- 2. MIGRATION RUNTIME USER (Prisma Schema Evolution & DDL in CI/CD)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
    CREATE ROLE migration_user WITH LOGIN PASSWORD 'MigrationUserSecurePass2026!ReplaceInVault';
  END IF;
END $$;

GRANT CONNECT ON DATABASE rental_peshawar_prod TO migration_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO migration_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO migration_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO migration_user;

-- -----------------------------------------------------------------------------
-- 3. ANALYTICS REPORTING USER (Read-Only SELECT, No Write Access)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_user') THEN
    CREATE ROLE analytics_user WITH LOGIN PASSWORD 'AnalyticsUserSecurePass2026!ReplaceInVault';
  END IF;
END $$;

GRANT CONNECT ON DATABASE rental_peshawar_prod TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_user;

-- -----------------------------------------------------------------------------
-- 4. BACKUP SERVICE USER (pg_dump Streaming Privileges Only)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'backup_user') THEN
    CREATE ROLE backup_user WITH LOGIN PASSWORD 'BackupUserSecurePass2026!ReplaceInVault';
  END IF;
END $$;

GRANT CONNECT ON DATABASE rental_peshawar_prod TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
GRANT pg_read_all_data TO backup_user;

-- -----------------------------------------------------------------------------
-- 5. SECURE DEFAULT REVOCATIONS
-- -----------------------------------------------------------------------------
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE rental_peshawar_prod FROM PUBLIC;

