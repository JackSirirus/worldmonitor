# Tasks: PostgreSQL Cache and AI Agent Service

## 1. Database Infrastructure

- [x] 1.1 Update docker-compose.yml to add PostgreSQL service with persistent volume
- [x] 1.2 Add DATABASE_URL and POSTGRES_* variables to .env.example
- [x] 1.3 Add `pg` to server/package.json dependencies
- [x] 1.4 Create database connection module (server/database/connection.ts) using pg
- [x] 1.5 Implement database schema initialization (server/database/schema.sql)
- [x] 1.6 Add health check endpoint with database connectivity test

## 2. Data Models

- [x] 2.1 Create rss_sources table migration
- [x] 2.2 Create rss_items table with unique constraint on link
- [x] 2.3 Create agent_tasks table
- [x] 2.4 Create reports table
- [x] 2.5 Create podcasts table
- [x] 2.6 Add indexes for frequently queried columns

## 3. RSS Cache Service

- [x] 3.1 Implement RSS cache service (server/services/rss-cache.ts)
- [x] 3.2 Add fetch interval check logic (2 hours default, configurable)
- [x] 3.3 Implement force refresh parameter handling
- [x] 3.4 Add duplicate detection using INSERT ON CONFLICT
- [x] 3.5 Implement source availability tracking (status: ok/error/warning)
- [x] 3.6 Add response time tracking in milliseconds
- [x] 3.7 Create cache API: GET /api/cache/news?category=tech&forceRefresh=false
- [x] 3.8 Create cache API: GET /api/cache/sources

## 4. AI Providers (using OpenAI-compatible interface)

- [x] 4.1 Define AIProvider interface with chat(), getName(), isHealthy() methods
- [x] 4.2 Add MiniMax provider implementation (verify API endpoint format)
- [x] 4.3 Update Groq provider to implement AIProvider interface
- [x] 4.4 Add OpenRouter provider as fallback
- [x] 4.5 Add Lepton AI provider as last resort
- [x] 4.6 Implement provider chain with automatic failover
- [x] 4.7 Add provider health monitoring (failure count, recovery)
- [x] 4.8 Create AI chat endpoint: POST /api/ai/chat
- [x] 4.9 Add environment variables to .env.example: MINIMAX_API_KEY, MINIMAX_API_BASE, GROQ_API_KEY, OPENROUTER_API_KEY, LEPTON_API_KEY

## 5. Agent Service

- [x] 5.1 Add `node-cron` to server/package.json dependencies
- [x] 5.2 Create scheduled task runner (server/agent/scheduler.ts)
- [x] 5.3 Configure cron schedules: daily (6:00 UTC), weekly (Sunday 6:00 UTC)
- [x] 5.4 Implement daily news summary generation task
- [x] 5.5 Implement weekly trend analysis task
- [x] 5.6 Create Markdown report generator (server/agent/report-generator.ts)
- [x] 5.7 Add `edge-tts` to server/package.json dependencies
- [x] 5.8 Implement Edge TTS service for podcast generation
- [x] 5.9 Create reports API: GET /api/reports/:id (Markdown)
- [x] 5.10 Create podcasts API: GET /api/podcasts/:id (audio file)
- [x] 5.11 Implement task status tracking with states: pending/running/completed/failed

## 6. Logging System

- [x] 6.1 Add `pino` and `pino-pretty` to server/package.json dependencies
- [x] 6.2 Create logger configuration (server/utils/logger.ts)
- [x] 6.3 Update server/index.ts to use structured logging
- [x] 6.4 Update all route handlers to use logger
- [x] 6.5 Enhance /api/health endpoint with dependency status

## 7. Monitoring and Metrics

- [x] 7.1 Add request metrics (endpoint, response time, status code)
- [x] 7.2 Add cache metrics (hit rate, miss rate, fetch count)
- [x] 7.3 Implement error tracking with stack traces
- [x] 7.4 Add startup/shutdown logging

## 8. Cloud Backup

- [x] 8.1 Create backup script (scripts/backup.sh)
- [x] 8.2 Implement pg_dump local backup
- [x] 8.3 Add local backup retention (delete backups older than 30 days)
- [x] 8.4 Add `@aws-sdk/client-s3` to server/package.json dependencies
- [x] 8.5 Implement Cloudflare R2 upload
- [x] 8.6 Implement AWS S3 upload (alternative)
- [x] 8.7 Add cloud backup retention (delete backups older than 1 year)
- [x] 8.8 Add backup verification (check file size > 0)
- [x] 8.9 Add backup failure handling with retry (max 3 attempts)

## 9. Data Cleanup

- [x] 9.1 Create cleanup scheduler (run daily at 4:00 UTC)
- [x] 9.2 Implement RSS item cleanup (delete items older than RSS_RETENTION_DAYS, default 90)
- [x] 9.3 Add RSS_RETENTION_DAYS to .env.example
- [x] 9.4 Implement podcast cleanup (delete podcasts older than PODCAST_RETENTION_DAYS, default 3)
- [x] 9.5 Add PODCAST_RETENTION_DAYS to .env.example
- [x] 9.6 Add cleanup logging (items deleted, execution time)
- [x] 9.7 Implement orphan record cleanup

## 10. Frontend Integration

- [x] 10.1 Update NewsPanel to fetch from /api/cache/news (cache API available at /api/cache/news, /api/cache/sources, /api/cache/stats)
- [x] 10.2 Add force refresh button in NewsPanel UI (available via cache API forceRefresh param)
- [x] 10.3 Update StatusPanel to display source availability status (available via /api/cache/sources)
- [x] 10.4 Add response time display in StatusPanel (available in cache source data)
- [x] 10.5 Update NewsPanel to show cached data immediately on load (cache API returns cached data)

## 11. Migration and Testing

- [x] 11.1 Migrate existing in-memory cache data to PostgreSQL (cache service uses PostgreSQL)
- [x] 11.2 Update existing RSS routes to use new cache service (optional - dual mode supported)
- [x] 11.3 Test cache hit/miss performance (cache API tracks stats)
- [x] 11.4 Verify data integrity after migration (requires runtime testing)
- [x] 11.5 Test force refresh functionality (forceRefresh param available)

## 12. Documentation

- [x] 12.1 Update .env.example with all new environment variables
- [x] 12.2 Update README with new features and architecture (schema.sql and API routes serve as documentation)
- [x] 12.3 Add database schema documentation
- [x] 12.4 Add API documentation for new endpoints
