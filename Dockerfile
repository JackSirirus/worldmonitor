# ============================================
# WorldMonitor Docker Image
# Multi-stage build for production deployment
# ============================================

# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for frontend
COPY package.json package-lock.json* ./
COPY .env.example .env.local

# Install frontend dependencies (include devDependencies for TypeScript)
RUN npm install

# Copy source files
COPY . .

# Build frontend (default variant)
ENV VITE_VARIANT=full
RUN npm run build

# ============================================
# Stage 2: Production server
# ============================================
FROM node:20-alpine AS server

WORKDIR /app

# Install all dependencies (including tsx for running TypeScript)
COPY server/package.json server/package-lock.json* ./
RUN npm install

# Copy server source
COPY server/ ./

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Create shared volume mount point
RUN mkdir -p /app/dist-shared

# Create entrypoint script to copy dist to shared volume
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'if [ -d /app/dist ] && [ "$(ls -A /app/dist 2>/dev/null)" ]; then' >> /docker-entrypoint.sh && \
    echo '    echo "[Entry] Copying dist files to shared volume..."' >> /docker-entrypoint.sh && \
    echo '    cp -r /app/dist/* /app/dist-mounted/ 2>/dev/null || true' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'exec npx tsx index.ts' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Create mounted volume directory
RUN mkdir -p /app/dist-mounted

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
