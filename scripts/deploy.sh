#!/bin/bash
# Deployment Script for WorldMonitor
# Usage: ./deploy.sh [environment]

set -e

ENV=${1:-staging}
VERSION=${2:-latest}

echo "[Deploy] Starting deployment to ${ENV}"

# Docker Compose commands
COMPOSE_FILE="docker-compose.yml"

case $ENV in
  staging)
    echo "[Deploy] Deploying to staging..."
    docker-compose -f ${COMPOSE_FILE} pull
    docker-compose -f ${COMPOSE_FILE} up -d
    ;;
  production)
    echo "[Deploy] Deploying to production..."
    # Backup database before deployment
    docker-compose -f ${COMPOSE_FILE} exec -T postgres pg_dump -U worldmonitor worldmonitor > backup-$(date +%Y%m%d).sql

    # Pull and restart
    docker-compose -f ${COMPOSE_FILE} pull
    docker-compose -f ${COMPOSE_FILE} up -d --no-deps

    # Health check
    echo "[Deploy] Waiting for services..."
    sleep 30

    # Check health
    curl -sf https://worldmonitor.app/api/health/live || exit 1
    ;;
  *)
    echo "[Deploy] Unknown environment: ${ENV}"
    exit 1
    ;;
esac

echo "[Deploy] Deployment complete!"

# Show status
docker-compose -f ${COMPOSE_FILE} ps
