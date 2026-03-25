#!/bin/bash
# SSL Certificate Auto-Renewal Script
# Run via cron: 0 3 * * * /path/to/renew-ssl.sh

set -e

# Configuration
EMAIL="admin@example.com"
DOMAIN="worldmonitor.app"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"
WEBROOT="/var/www/html"

echo "[SSL] Starting certificate renewal for ${DOMAIN}"

# Check if certificate exists
if [ ! -d "${CERT_PATH}" ]; then
    echo "[SSL] No certificate found, requesting new one..."
    certbot certonly --webroot -w "${WEBROOT}" -d "${DOMAIN}" -d "www.${DOMAIN}" \
        --email "${EMAIL}" --agree-tos --non-interactive
else
    # Renew existing certificate
    echo "[SSL] Renewing existing certificate..."
    certbot renew --quiet --deploy-hook "nginx -s reload"
fi

# Reload nginx
echo "[SSL] Reloading nginx..."
nginx -s reload

echo "[SSL] Certificate renewal complete"
