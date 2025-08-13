#!/bin/bash

# ALCN Database Backup Script
# Automatically creates database backups using environment variables

set -e  # Exit on any error

# Load environment variables from .env file
if [ -f "/app/.env" ]; then
    export $(grep -v '^#' /app/.env | xargs)
elif [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "ERROR: .env file not found!"
    exit 1
fi

# Create backup directory
BACKUP_DIR="/app/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="alcn_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

echo "Starting database backup at $(date)"
echo "Backup file: $BACKUP_FILENAME"

# Set password for pg_dump
export PGPASSWORD="$POSTGRES_PASSWORD"

# Set database host (use 'db' for Docker, 'localhost' for local)
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"

# Create backup
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-owner \
    --no-privileges \
    -f "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    # Get backup file size
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "   File: $BACKUP_FILENAME"
    echo "   Size: $BACKUP_SIZE"
    echo "   Path: $BACKUP_PATH"
    
    # Optional: Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "alcn_backup_*.sql" -mtime +7 -delete
    
    echo "🧹 Old backups (>7 days) cleaned up"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "Backup completed at $(date)"