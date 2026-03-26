# ============================================
# WorldMonitor Docker Image
# Production deployment with pre-built dist
# ============================================

# Build locally first:
#   npm run build
#
# Then build Docker:
#   docker-compose build worldmonitor
#
# This approach skips npm install inside Docker to avoid network issues

FROM node:20-alpine

WORKDIR /app

# Install server dependencies (required for tsx)
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev && npm install tsx

# Copy server source
COPY server/ ./

# Copy pre-built frontend dist (you must run `npm run build` first)
COPY dist ./dist

# Create shared volume mount point
RUN mkdir -p /app/dist-shared /app/dist-mounted

# Create entrypoint script to copy dist to shared volume
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'if [ -d /app/dist ] && [ "$(ls -A /app/dist 2>/dev/null)" ]; then' >> /docker-entrypoint.sh && \
    echo '    echo "[Entry] Copying dist files to shared volume..."' >> /docker-entrypoint.sh && \
    echo '    cp -r /app/dist/* /app/dist-mounted/ 2>/dev/null || true' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'exec npx tsx index.ts' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use entrypoint script to copy dist to shared volume
ENTRYPOINT ["/docker-entrypoint.sh"]
