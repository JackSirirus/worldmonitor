#!/bin/bash
#
# Backup Script for WorldMonitor PostgreSQL Database
# Usage: ./scripts/backup.sh
#

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATABASE_URL="${DATABASE_URL}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MAX_RETRIES=3
RETRY_DELAY=5

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

# Parse DATABASE_URL
parse_db_url() {
    if [[ ! $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        error "Invalid DATABASE_URL format"
        exit 1
    fi

    PGUSER="${BASH_REMATCH[1]}"
    PGPASSWORD="${BASH_REMATCH[2]}"
    PGHOST="${BASH_REMATCH[3]}"
    PGPORT="${BASH_REMATCH[4]}"
    PGDATABASE="${BASH_REMATCH[5]}"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate filename
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/worldmonitor-$TIMESTAMP.sql"

log "Starting database backup..."

# Parse database URL
parse_db_url

# Export credentials
export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE

# Attempt backup with retries
for attempt in $(seq 1 $MAX_RETRIES); do
    log "Backup attempt $attempt of $MAX_RETRIES..."

    if PGPASSWORD="$PGPASSWORD" pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$BACKUP_FILE" 2>/dev/null; then
        # Verify backup file
        if [ -s "$BACKUP_FILE" ]; then
            log "Backup created successfully: $BACKUP_FILE"
            log "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
            break
        else
            error "Backup file is empty"
            rm -f "$BACKUP_FILE"
        fi
    else
        error "Backup attempt $attempt failed"
        rm -f "$BACKUP_FILE"

        if [ $attempt -lt $MAX_RETRIES ]; then
            log "Retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    fi
done

# Check if backup succeeded
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup failed after $MAX_RETRIES attempts"
    exit 1
fi

# Upload to cloud if configured
if [ -n "$R2_BUCKET" ] || [ -n "$S3_BUCKET" ]; then
    log "Uploading backup to cloud storage..."

    if [ -n "$R2_BUCKET" ] && [ -n "$R2_ENDPOINT" ]; then
        log "Uploading to Cloudflare R2..."
        # R2 upload handled by server agent
    elif [ -n "$S3_BUCKET" ]; then
        log "Uploading to AWS S3..."
        # S3 upload handled by server agent
    fi
fi

# Cleanup old local backups
log "Cleaning up old local backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "worldmonitor-*.sql" -mtime +$RETENTION_DAYS -delete
CLEANED_COUNT=$(find "$BACKUP_DIR" -name "worldmonitor-*.sql" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log "Cleaned up $CLEANED_COUNT old backup(s)"

# List current backups
CURRENT_BACKUPS=$(ls -1 "$BACKUP_DIR"/worldmonitor-*.sql 2>/dev/null | wc -l)
log "Current backup count: $CURRENT_BACKUPS"

log "Backup completed successfully!"

# Exit with success
exit 0
