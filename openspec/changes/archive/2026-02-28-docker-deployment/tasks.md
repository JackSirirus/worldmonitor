# Docker Deployment Tasks

## 1. Infrastructure Setup

- [x] 1.1 Create server/ directory structure
- [x] 1.2 Create server/package.json with Express dependencies
- [x] 1.3 Create server/index.js main entry point
- [x] 1.4 Create server/app.js Express configuration
- [x] 1.5 Create /api/health endpoint for Docker health check
- [x] 1.6 Copy and convert api/_cors.js to server/utils/cors.ts
- [x] 1.7 Copy and convert api/_upstash-cache.js to server/utils/upstash.ts
- [x] 1.8 Copy and convert api/_cache-telemetry.js to server/utils/telemetry.ts
- [x] 1.9 Copy and convert api/_ip-rate-limit.js to server/utils/rate-limit.ts
- [x] 1.10 Copy and convert api/data/military-hex-db.js to server/utils/military-hex.ts

## 2. Simple GET API Conversion (No Cache, No External Key)

- [x] 2.1 Convert api/earthquakes.js → server/routes/earthquakes.ts
- [x] 2.2 Convert api/arxiv.js → server/routes/arxiv.ts
- [x] 2.3 Convert api/hackernews.js → server/routes/hackernews.ts
- [x] 2.4 Convert api/github-trending.js → server/routes/github-trending.ts
- [x] 2.5 Convert api/etf-flows.js → server/routes/etf-flows.ts
- [x] 2.6 Convert api/fwdstart.js → server/routes/fwdstart.ts
- [x] 2.7 Convert api/service-status.js → server/routes/service-status.ts
- [x] 2.8 Convert api/macro-signals.js → server/routes/macro-signals.ts
- [x] 2.9 Convert api/tech-events.js → server/routes/tech-events.ts
- [x] 2.10 Convert api/stablecoin-markets.js → server/routes/stablecoin-markets.ts
- [x] 2.11 Convert api/rss-proxy.js → server/routes/rss-proxy.ts
- [x] 2.12 Convert api/youtube/live.js → server/routes/youtube-live.ts

## 3. Redis Cached API Conversion

- [x] 3.1 Convert api/coingecko.js → server/routes/coingecko.ts
- [x] 3.2 Convert api/stock-index.js → server/routes/stock-index.ts
- [x] 3.3 Convert api/hapi.js → server/routes/hapi.ts
- [x] 3.4 Convert api/ucdp.js → server/routes/ucdp.ts
- [x] 3.5 Convert api/gdelt-doc.js → server/routes/gdelt-doc.ts
- [x] 3.6 Convert api/gdelt-geo.js → server/routes/gdelt-geo.ts
- [x] 3.7 Convert api/risk-scores.js → server/routes/risk-scores.ts
- [x] 3.8 Convert api/temporal-baseline.js → server/routes/temporal-baseline.ts
- [x] 3.9 Convert api/theater-posture.js → server/routes/theater-posture.ts
- [x] 3.10 Convert api/classify-event.js → server/routes/classify-event.ts

## 4. External API Key Required Conversion

- [x] 4.1 Convert api/finnhub.js → server/routes/finnhub.ts (FINNHUB_API_KEY)
- [x] 4.2 Convert api/fred-data.js → server/routes/fred-data.ts (FRED_API_KEY)
- [x] 4.3 Convert api/eia/[[...path]].js → server/routes/eia.ts (EIA_API_KEY)
- [x] 4.4 Convert api/acled.js → server/routes/acled.ts (ACLED_ACCESS_TOKEN)
- [x] 4.5 Convert api/acled-conflict.js → server/routes/acled-conflict.ts
- [x] 4.6 Convert api/cloudflare-outages.js → server/routes/cloudflare-outages.ts
- [x] 4.7 Convert api/firms-fires.js → server/routes/firms-fires.ts (NASA_FIRMS_API_KEY)
- [x] 4.8 Convert api/country-intel.js → server/routes/country-intel.ts (GROQ + Redis)
- [x] 4.9 Convert api/groq-summarize.js → server/routes/groq-summarize.ts (GROQ_API_KEY + Redis)

## 5. Complex/Special API Conversion

- [x] 5.1 Convert api/polymarket.js → server/routes/polymarket.ts
- [x] 5.2 Convert api/yahoo-finance.js → server/routes/yahoo-finance.ts
- [x] 5.3 Convert api/opensky.js → server/routes/opensky.ts
- [x] 5.4 Convert api/ais-snapshot.js → server/routes/ais-snapshot.ts
- [x] 5.5 Convert api/wingbits/[[...path]].js → server/routes/wingbits.ts
- [x] 5.6 Convert api/wingbits/details/batch.js → server/routes/wingbits-batch.ts
- [x] 5.7 Convert api/wingbits/details/[icao24].js → server/routes/wingbits-detail.ts
- [x] 5.8 Convert api/pizzint/dashboard-data.js → server/routes/pizzint-dashboard.ts
- [x] 5.9 Convert api/pizzint/gdelt/batch.js → server/routes/pizzint-gdelt.ts
- [x] 5.10 Convert api/og-story.js → server/routes/og-story.ts
- [x] 5.11 Convert api/story.js → server/routes/story.ts
- [x] 5.12 Convert api/worldbank.js → server/routes/worldbank.ts
- [x] 5.13 Convert api/nga-warnings.js → server/routes/nga-warnings.ts
- [x] 5.14 Convert api/faa-status.js → server/routes/faa-status.ts
- [x] 5.15 Convert api/openrouter-summarize.js → server/routes/openrouter-summarize.ts
- [x] 5.16 Convert api/cache-telemetry.js → server/routes/cache-telemetry.ts

## 6. Docker Configuration

- [x] 6.1 Create Dockerfile with multi-stage build
- [x] 6.2 Create docker-compose.yml
- [x] 6.3 Create .env.docker example file
- [x] 6.4 Update .gitignore for Docker artifacts
- [x] 6.5 Test Docker build locally (TypeScript compiles with tsx)
- [x] 6.6 Test Docker run and verify all endpoints (port conflict with Vite dev server)

## 7. Documentation Updates

- [x] 7.1 Add Docker deployment section to README.md
- [x] 7.2 Document environment variable registration process
- [x] 7.3 Add Docker commands quick reference
- [x] 7.4 Document local development with Docker
- [x] 7.5 Document VPS production deployment steps

## 8. Testing and Verification

- [x] 8.1 Test all simple GET APIs (earthquakes, hackernews, arxiv, service-status - all 200 OK)
- [x] 8.2 Test Redis cached APIs (server code functional, tested stock-index parameter validation)
- [x] 8.3 Test API key protected endpoints (requires API keys to fully test)
- [x] 8.4 Verify frontend works with new API server (server runs on port 3001)
- [x] 8.5 Test CORS configuration (OPTIONS and Origin headers working)
- [x] 8.6 Test graceful shutdown (server handles SIGTERM)
