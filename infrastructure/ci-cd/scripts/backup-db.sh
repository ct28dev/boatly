#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# BOATLY — Database Backup Script
# Usage: ./backup-db.sh [--upload-s3]
#
# Requires:
#   - Docker running with boatly-postgres container
#   - aws CLI configured (for S3 upload)
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-boatly-postgres}"
DB_USER="${DB_USER:-boatly}"
DB_NAME="${DB_NAME:-boatly}"
BACKUP_DIR="${BACKUP_DIR:-/opt/boatly/backups}"
S3_BUCKET="${S3_BUCKET:-boatly-backups}"
S3_PREFIX="${S3_PREFIX:-database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
UPLOAD_S3=false

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="boatly_${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[BACKUP]${NC} $1"; }
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
command -v docker >/dev/null 2>&1 || { err "Docker is not installed"; exit 1; }

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    err "Container '${DB_CONTAINER}' is not running"
    exit 1
fi

if [ "$UPLOAD_S3" = true ]; then
    command -v aws >/dev/null 2>&1 || { err "AWS CLI is required for S3 upload"; exit 1; }
fi

# ─── Create backup directory ────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── Dump database ──────────────────────────────────────────────────
log "Starting backup of database '${DB_NAME}'..."
log "Container: ${DB_CONTAINER}"
log "Timestamp: ${TIMESTAMP}"

docker exec "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --format=plain \
    > "${BACKUP_DIR}/${BACKUP_FILE}"

DUMP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Database dump complete (${DUMP_SIZE})"

# ─── Compress backup ────────────────────────────────────────────────
log "Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)
log "Compressed backup: ${COMPRESSED_FILE} (${COMPRESSED_SIZE})"

# ─── Upload to S3 (optional) ────────────────────────────────────────
if [ "$UPLOAD_S3" = true ]; then
    S3_PATH="s3://${S3_BUCKET}/${S3_PREFIX}/${COMPRESSED_FILE}"
    log "Uploading to ${S3_PATH}..."

    aws s3 cp "${BACKUP_DIR}/${COMPRESSED_FILE}" "$S3_PATH" \
        --storage-class STANDARD_IA

    log "S3 upload complete"

    # Verify upload
    if aws s3 ls "$S3_PATH" > /dev/null 2>&1; then
        log "S3 upload verified"
    else
        err "S3 upload verification failed!"
        exit 1
    fi
fi

# ─── Cleanup old local backups ───────────────────────────────────────
log "Removing local backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name "boatly_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
log "Removed ${DELETED} old backup(s)"

# ─── Summary ─────────────────────────────────────────────────────────
log "Backup completed successfully!"
log "  File: ${BACKUP_DIR}/${COMPRESSED_FILE}"
log "  Size: ${COMPRESSED_SIZE}"
if [ "$UPLOAD_S3" = true ]; then
    log "  S3:   s3://${S3_BUCKET}/${S3_PREFIX}/${COMPRESSED_FILE}"
fi
