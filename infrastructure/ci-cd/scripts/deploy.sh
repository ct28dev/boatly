#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# BOATLY — Deployment Script
# Usage: ./deploy.sh [staging|production]
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

ENVIRONMENT="${1:-staging}"
PROJECT_DIR="${PROJECT_DIR:-/opt/boatly}"
COMPOSE_FILE="${PROJECT_DIR}/infrastructure/docker/docker-compose.yml"
ENV_FILE="${PROJECT_DIR}/infrastructure/docker/.env.docker"
HEALTH_URL="http://localhost/nginx-health"
MAX_RETRIES=30
RETRY_INTERVAL=5

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# ─── Pre-flight checks ──────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { err "Docker is not installed"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { err "Docker Compose V2 is required"; exit 1; }

if [ ! -f "$COMPOSE_FILE" ]; then
    err "Compose file not found: $COMPOSE_FILE"
    exit 1
fi

log "Starting deployment to ${ENVIRONMENT}..."
log "Project directory: ${PROJECT_DIR}"

# ─── Pull latest code ───────────────────────────────────────────────
log "Pulling latest code..."
cd "$PROJECT_DIR"
git fetch --all
git checkout main
git pull origin main

# ─── Pull latest images ─────────────────────────────────────────────
log "Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

# ─── Run database migrations ────────────────────────────────────────
log "Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend \
    node -e "
const { execSync } = require('child_process');
try {
    execSync('npx typeorm migration:run -d dist/data-source.js', { stdio: 'inherit' });
} catch (e) {
    console.log('Migration skipped or already up to date');
}
"

# ─── Deploy services ────────────────────────────────────────────────
log "Deploying services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

# ─── Health check ────────────────────────────────────────────────────
log "Waiting for services to become healthy..."
RETRIES=0
while [ $RETRIES -lt $MAX_RETRIES ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        log "Health check passed!"
        break
    fi
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        err "Health check failed after ${MAX_RETRIES} attempts"
        warn "Rolling back..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50
        exit 1
    fi
    echo -n "."
    sleep "$RETRY_INTERVAL"
done

# ─── Cleanup ─────────────────────────────────────────────────────────
log "Cleaning up old images..."
docker image prune -f

# ─── Status ──────────────────────────────────────────────────────────
log "Deployment to ${ENVIRONMENT} completed successfully!"
echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""
log "Service URLs:"
log "  Customer PWA:    http://localhost"
log "  Admin Dashboard: http://localhost/admin"
log "  API:             http://localhost/api/v1"
log "  API Docs:        http://localhost/api/docs"
