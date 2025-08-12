#!/bin/bash

# Setup automated database backups using cron
# Run this script once to set up nightly backups

set -e

echo "Setting up automated database backups..."

# Create cron job for nightly backups at 2 AM
CRON_JOB="0 2 * * * cd /app && /app/scripts/backup.sh >> /app/backups/backup.log 2>&1"

# Add cron job to root's crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 Database will be backed up every night at 2:00 AM"
echo "📝 Logs will be saved to /app/backups/backup.log"
echo ""
echo "To view current crontab:"
echo "   crontab -l"
echo ""
echo "To check backup logs:"
echo "   tail -f /app/backups/backup.log"
echo ""
echo "To manually run backup:"
echo "   /app/scripts/backup.sh"