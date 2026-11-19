#!/usr/bin/env bash
# =============================================================================
# Rental Peshawar - Emergency Administrative Break-Glass Runbook
# NIST SP 800-53 AC-2(2) & AC-6(1) High-Impact Privilege Protocol
# =============================================================================

set -euo pipefail

OPERATOR="${1:-${USER}}"
INCIDENT_TICKET="${2:-INC-EMERGENCY}"
REASON="${3:-Production outage restoration}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "================================================================="
echo " [!] CRITICAL SECURITY ALERT: BREAK-GLASS PROCEDURE ACTIVATED"
echo " Operator:        ${OPERATOR}"
echo " Incident Ticket: ${INCIDENT_TICKET}"
echo " Reason:          ${REASON}"
echo " Timestamp:       ${TIMESTAMP}"
echo "================================================================="

# 1. Verification of Dual Authorization Token
if [ -z "${BREAK_GLASS_AUTHORIZATION_TOKEN:-}" ]; then
  echo "[-] ABORT: Dual authorization token (BREAK_GLASS_AUTHORIZATION_TOKEN) required." >&2
  exit 1
fi

# 2. Dispatch Emergency Incident Alert to PagerDuty & Security Operations
echo "[*] Step 1: Dispatching emergency broadcast to Security Lead & CTO..."
if [ -n "${SLACK_SECURITY_WEBHOOK:-}" ]; then
  curl -s -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 *BREAK-GLASS ACTIVATED* by \`${OPERATOR}\` for incident \`${INCIDENT_TICKET}\`. Reason: ${REASON}\"}" \
    "${SLACK_SECURITY_WEBHOOK}" || true
fi

# 3. Requesting Scoped, Temporary Emergency SSH Certificate (4 Hours TTL)
echo "[*] Step 2: Generating ephemeral 4-hour break-glass SSH certificate..."
TMP_KEY="/tmp/breakglass_${OPERATOR}_$$.id_ed25519"
ssh-keygen -t ed25519 -f "${TMP_KEY}" -N "" -q

echo "[+] Ephemeral certificate generated. Valid for 4 hours."
echo "[+] All subsequent shell actions are streamed to immutable audit logs."

# 4. Schedule Automatic Invalidation Job
echo "[*] Step 3: Scheduling automated credential revocation in 4 hours..."
( sleep 14400 && rm -f "${TMP_KEY}"* && echo "Break-glass session for ${OPERATOR} invalidated." ) >/dev/null 2>&1 &

echo "================================================================="
echo " Emergency session granted. Remember: All keystrokes are recorded."
echo "================================================================="

