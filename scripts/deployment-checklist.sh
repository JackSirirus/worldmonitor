#!/bin/bash
# WorldMonitor Deployment Checklist
# Run this after provisioning your cloud server

set -e

echo "=== WorldMonitor Deployment Checklist ==="
echo ""

# Check prerequisites
echo "[1/8] Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose not installed"
    exit 1
fi

echo "✓ Docker and Docker Compose installed"

# Setup firewall
echo ""
echo "[2/8] Setting up firewall..."
echo "# Run manually:"
echo "  sudo ufw allow 22    # SSH"
echo "  sudo ufw allow 80    # HTTP"
echo "  sudo ufw allow 443   # HTTPS"
echo "  sudo ufw enable"

# Clone repo
echo ""
echo "[3/8] Cloning repository..."
if [ ! -d "/opt/worldmonitor" ]; then
    echo "  mkdir -p /opt/worldmonitor"
    echo "  git clone <your-repo> /opt/worldmonitor"
else
    echo "  Repository already exists at /opt/worldmonitor"
fi

# Environment setup
echo ""
echo "[4/8] Setting up environment..."
echo "  cp .env.example .env"
echo "  # Edit .env with your configuration"

# Database setup
echo ""
echo "[5/8] Database setup..."
echo "  # PostgreSQL will be started by docker-compose"
echo "  # Ensure DATABASE_URL is set in .env"

# SSL setup
echo ""
echo "[6/8] SSL Certificate (Let's Encrypt)..."
echo "  # After domain DNS is configured:"
echo "  certbot certonly --webroot -w /var/www/html -d yourdomain.com"

# Start services
echo ""
echo "[7/8] Starting services..."
echo "  docker-compose up -d"

# Verify
echo ""
echo "[8/8] Verification..."
echo "  curl http://localhost/api/health"
echo "  curl http://localhost/api/news"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS"
echo "2. Set up SSL certificate"
echo "3. Test the application"
