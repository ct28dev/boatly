#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# BOATLY — MySQL backup (XAMPP on macOS)
#
# Usage:
#   ./backup-mysql-xampp.sh
#   BACKUP_DIR=~/Desktop/boatly-sql ./backup-mysql-xampp.sh
#   ./backup-mysql-xampp.sh --upload-s3
#
# Env (optional):
#   MYSQLDUMP_BIN  Path to mysqldump (default: XAMPP Mac)
#   MYSQL_BIN      Path to mysql client (for preflight; default: same dir)
#   DB_HOST        Default 127.0.0.1 (TCP; reliable for cron)
#   DB_USER        Default root
#   DB_PASSWORD    Default empty (XAMPP dev)
#   DB_NAME        Default boatly
#   BACKUP_DIR     Default ~/boatly-backups/mysql
#   RETENTION_DAYS Default 30
#   S3_BUCKET, S3_PREFIX — same as backup-db.sh when using --upload-s3
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

XAMPP_MYSQL_BIN="${XAMPP_MYSQL_BIN:-/Applications/XAMPP/xamppfiles/bin}"
MYSQLDUMP_BIN="${MYSQLDUMP_BIN:-${XAMPP_MYSQL_BIN}/mysqldump}"
MYSQL_BIN="${MYSQL_BIN:-${XAMPP_MYSQL_BIN}/mysql}"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-boatly}"

BACKUP_DIR="${BACKUP_DIR:-$HOME/boatly-backups/mysql}"
S3_BUCKET="${S3_BUCKET:-boatly-backups}"
S3_PREFIX="${S3_PREFIX:-database/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
UPLOAD_S3=false

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="boatly_${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[BACKUP-MYSQL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# ─── Parse arguments ────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --upload-s3) UPLOAD_S3=true; shift ;;
        --bucket)    S3_BUCKET="$2"; shift 2 ;;
        --dir)       BACKUP_DIR="$2"; shift 2 ;;
        --retain)    RETENTION_DAYS="$2"; shift 2 ;;
        *) err "Unknown option: $1"; exit 1 ;;
    esac
done

# ─── Pre-flight checks ──────────────────────────────────────────────
[[ -x "$MYSQLDUMP_BIN" ]] || { err "mysqldump not found or not executable: ${MYSQLDUMP_BIN}"; exit 1; }
[[ -x "$MYSQL_BIN" ]] || warn "mysql client not found at ${MYSQL_BIN} (preflight skipped)"

if [[ "$UPLOAD_S3" == true ]]; then
    command -v aws >/dev/null 2>&1 || { err "AWS CLI is required for --upload-s3"; exit 1; }
fi

mkdir -p "$BACKUP_DIR"

# Optional connectivity check
if [[ -x "$MYSQL_BIN" ]]; then
    if [[ -n "$DB_PASSWORD" ]]; then
        _check=( "$MYSQL_BIN" -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" )
    else
        _check=( "$MYSQL_BIN" -h"$DB_HOST" -u"$DB_USER" )
    fi
    if ! "${_check[@]}" -e "USE \`${DB_NAME}\`; SELECT 1" >/dev/null 2>&1; then
        err "Cannot connect to MySQL or database '${DB_NAME}' does not exist."
        err "Start MySQL in XAMPP and ensure the database exists (e.g. run setup.php)."
        exit 1
    fi
fi

# ─── Build secure defaults file for mysqldump (avoids -p on command line) ─
_defaults=$(mktemp)
chmod 600 "$_defaults"
cleanup() { rm -f "$_defaults"; }
trap cleanup EXIT

{
    echo "[client]"
    echo "host=${DB_HOST}"
    echo "user=${DB_USER}"
    if [[ -n "$DB_PASSWORD" ]]; then
        echo "password=${DB_PASSWORD}"
    fi
} > "$_defaults"

log "Dumping MySQL database '${DB_NAME}' (${DB_HOST})..."
log "Timestamp: ${TIMESTAMP}"

# --column-statistics=0: avoids warnings when client/server versions differ (common on Mac)
# Note: omit --column-statistics (MySQL 8 client flag); XAMPP ships MariaDB mysqldump which rejects it.
# Omit --events: XAMPP/MariaDB often has event_scheduler off; SHOW EVENTS then fails (errno 1577).
# Skip stored routines: BOATLY MySQL schema does not use PROCEDURE/FUNCTION; skipping avoids mysql.proc
# errors after partial MariaDB upgrades (run mysql_upgrade if you need routines).
"$MYSQLDUMP_BIN" \
    --defaults-extra-file="$_defaults" \
    --single-transaction \
    --skip-routines \
    --triggers \
    --default-character-set=utf8mb4 \
    "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"

DUMP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Dump complete (${DUMP_SIZE})"

log "Compressing..."
gzip -f "${BACKUP_DIR}/${BACKUP_FILE}"

COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)
log "Compressed: ${COMPRESSED_FILE} (${COMPRESSED_SIZE})"

if [[ "$UPLOAD_S3" == true ]]; then
    S3_PATH="s3://${S3_BUCKET}/${S3_PREFIX}/${COMPRESSED_FILE}"
    log "Uploading to ${S3_PATH}..."
    aws s3 cp "${BACKUP_DIR}/${COMPRESSED_FILE}" "$S3_PATH" --storage-class STANDARD_IA
    if aws s3 ls "$S3_PATH" >/dev/null 2>&1; then
        log "S3 upload verified"
    else
        err "S3 upload verification failed"
        exit 1
    fi
fi

log "Removing local files older than ${RETENTION_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name 'boatly_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete -print 2>/dev/null | wc -l | tr -d ' ')
log "Removed ${DELETED} old backup(s)"

log "Done."
log "  File: ${BACKUP_DIR}/${COMPRESSED_FILE}"
