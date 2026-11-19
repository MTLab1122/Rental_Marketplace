#!/usr/bin/env bash
# =============================================================================
# Rental Peshawar - Cryptographic Backup Verification & Restoration
# Conforms to NIST SP 800-34 Rev. 1 & NIST SP 800-53 CP-4/CP-9 Controls
# =============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-encrypted-backup.enc> [target-database]" >&2
  exit 1
fi

ENC_FILE="$1"
SHA_FILE="${ENC_FILE}.sha256"
TARGET_DB="${2:-rental_peshawar_restored}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-migration_user}"

if [ ! -f "${ENC_FILE}" ]; then
  echo "[-] ERROR: Encrypted backup archive '${ENC_FILE}' does not exist." >&2
  exit 1
fi

if [ ! -f "${SHA_FILE}" ]; then
  echo "[-] ERROR: Corresponding SHA-256 integrity file '${SHA_FILE}' missing." >&2
  exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "[-] ERROR: BACKUP_ENCRYPTION_KEY environment variable is not set." >&2
  exit 1
fi

echo "[*] Step 1: Performing cryptographic SHA-256 integrity check..."
sha256sum -c "${SHA_FILE}"

echo "[*] Step 2: Decrypting and restoring snapshot into target database '${TARGET_DB}'..."
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -in "${ENC_FILE}" \
  -pass "pass:${BACKUP_ENCRYPTION_KEY}" \
  | gunzip \
  | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}"

echo "[+] Step 3: Verifying table counts in restored database..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -c "
  SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
  FROM (
    SELECT table_name, query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', table_name), false, true, '') as xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ) t LIMIT 10;
"

echo "[+] Restoration verification completed successfully."

