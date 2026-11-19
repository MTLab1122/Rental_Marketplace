#!/usr/bin/env bash
# =============================================================================
# Rental Peshawar - Automated Encrypted Backup Script
# Conforms to NIST SP 800-34 Rev. 1 & FIPS 140-3 Cryptographic Requirements
# =============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/rental_peshawar}"
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="${POSTGRES_DB:-rental_peshawar_prod}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-backup_user}"

mkdir -p "${BACKUP_DIR}"

RAW_FILE="${BACKUP_DIR}/dump_${DATABASE_NAME}_${BACKUP_TIMESTAMP}.sql.gz"
ENC_FILE="${RAW_FILE}.enc"
SHA_FILE="${ENC_FILE}.sha256"

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "[-] ERROR: BACKUP_ENCRYPTION_KEY environment variable is not set." >&2
  exit 1
fi

echo "[*] Initiating PostgreSQL streaming backup for '${DATABASE_NAME}'..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DATABASE_NAME}" --no-owner --no-privileges | gzip -9 > "${RAW_FILE}"

echo "[*] Encrypting database snapshot with AES-256-CBC and PBKDF2 key derivation..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
  -in "${RAW_FILE}" \
  -out "${ENC_FILE}" \
  -pass "pass:${BACKUP_ENCRYPTION_KEY}"

echo "[*] Generating SHA-256 integrity checksum..."
sha256sum "${ENC_FILE}" > "${SHA_FILE}"

# Remove raw unencrypted dump
rm -f "${RAW_FILE}"

echo "[+] Backup successfully completed and secured:"
echo "    Archive:  ${ENC_FILE}"
echo "    Checksum: ${SHA_FILE}"

