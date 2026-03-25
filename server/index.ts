/**
 * WorldMonitor Express Server
 * Serves both API endpoints and static frontend files
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { createCorsMiddleware } from './utils/cors.ts';
import { rateLimitMiddleware } from './utils/rate-limit.ts';
import { checkConnection } from './database/connection.ts';
import { initializeSchema } from './database/schema.ts';
import { initializeScheduler, stopScheduler } from './agent/scheduler.ts';
import { seedDefaultJobs } from './repositories/tool.ts';

// Load environment variables
// Load .env from project root
dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers - Development mode allows all for map tiles and external resources
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"],
      fontSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "https:", "blob:"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "https:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - support custom domains via CORS_ORIGINS env var
const corsOptions = createCorsMiddleware();
app.use(cors(corsOptions));

// Rate limiting
app.use(rateLimitMiddleware);

// Health check endpoint with database connectivity (task 1.6)
app.get('/api/health', async (req, res) => {
  const dbCheck = await checkConnection();

  const health = {
    status: dbCheck.healthy ? 'ok' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      database: {
        healthy: dbCheck.healthy,
        latency: dbCheck.latency,
        error: dbCheck.error,
      },
    },
  };

  res.status(dbCheck.healthy ? 200 : 503).json(health);
});

// Import and mount routes (will be added as we convert APIs)
import { router as coingeckoRouter } from './routes/coingecko.ts';
import { router as earthquakesRouter } from './routes/earthquakes.ts';
import { router as arxivRouter } from './routes/arxiv.ts';
import { router as hackernewsRouter } from './routes/hackernews.ts';
import { router as githubTrendingRouter } from './routes/github-trending.ts';
import { router as fwdstartRouter } from './routes/fwdstart.ts';
import { router as techEventsRouter } from './routes/tech-events.ts';
import { router as etfFlowsRouter } from './routes/etf-flows.ts';
import { router as stablecoinMarketsRouter } from './routes/stablecoin-markets.ts';
import { router as stockIndexRouter } from './routes/stock-index.ts';
import { router as hapiRouter } from './routes/hapi.ts';
import { router as ucdpRouter } from './routes/ucdp.ts';
import { router as gdeltDocRouter } from './routes/gdelt-doc.ts';
import { router as gdeltGeoRouter } from './routes/gdelt-geo.ts';
import { router as riskScoresRouter } from './routes/risk-scores.ts';
import { router as temporalBaselineRouter } from './routes/temporal-baseline.ts';
import { router as theaterPostureRouter } from './routes/theater-posture.ts';
import { router as classifyEventRouter } from './routes/classify-event.ts';
import { router as finnhubRouter } from './routes/finnhub.ts';
import { router as fredDataRouter } from './routes/fred-data.ts';
import { router as eiaRouter } from './routes/eia.ts';
import { router as acledRouter } from './routes/acled.ts';
import { router as acledConflictRouter } from './routes/acled-conflict.ts';
import { router as cloudflareOutagesRouter } from './routes/cloudflare-outages.ts';
import { router as firesRouter } from './routes/fires.ts';
import { router as countryIntelRouter } from './routes/country-intel.ts';
import { router as groqSummarizeRouter } from './routes/groq-summarize.ts';
import { router as polymarketRouter } from './routes/polymarket.ts';
import { router as yahooFinanceRouter } from './routes/yahoo-finance.ts';
import { router as openskyRouter } from './routes/opensky.ts';
import { router as aisSnapshotRouter } from './routes/ais-snapshot.ts';
import { router as worldbankRouter } from './routes/worldbank.ts';
import { router as serviceStatusRouter } from './routes/service-status.ts';
import { router as macroSignalsRouter } from './routes/macro-signals.ts';
import { router as rssProxyRouter } from './routes/rss-proxy.ts';
import { router as youtubeLiveRouter } from './routes/youtube-live.ts';
import { router as wingbitsRouter } from './routes/wingbits.ts';
import { router as wingbitsBatchRouter } from './routes/wingbits-batch.ts';
import { router as wingbitsDetailRouter } from './routes/wingbits-detail.ts';
import { router as pizzintDashboardRouter } from './routes/pizzint-dashboard.ts';
import { router as pizzintGdeltRouter } from './routes/pizzint-gdelt.ts';
import { router as ogStoryRouter } from './routes/og-story.ts';
import { router as ngaWarningsRouter } from './routes/nga-warnings.ts';
import { router as faaStatusRouter } from './routes/faa-status.ts';
import { router as storyRouter } from './routes/story.ts';
import { router as openrouterSummarizeRouter } from './routes/openrouter-summarize.ts';
import { router as minimaxSummarizeRouter } from './routes/minimax-summarize.ts';
import { router as cacheTelemetryRouter } from './routes/cache-telemetry.ts';
import { router as cacheRouter } from './routes/cache.ts';
import { router as aiChatRouter } from './routes/ai-chat.ts';
import { router as reportsRouter } from './routes/reports.ts';
import { router as podcastsRouter } from './routes/podcasts.ts';
import { router as rssCollectorRouter } from './routes/rss-collector.ts';
import { router as sourceTiersRouter } from './routes/source-tiers.ts';
import { router as webSearchRouter } from './routes/web-search.ts';
import { router as agentRouter } from './routes/agent.ts';
import { router as newsRouter } from './routes/news.ts';
import { router as newsClustersRouter } from './routes/news-clusters.ts';
import { router as tasksRouter } from './routes/tasks.ts';
import { router as toolsRouter } from './routes/tools.ts';
import { router as logsRouter } from './routes/logs.ts';
import { router as healthRouter } from './routes/health.ts';
import { router as alertsRouter } from './routes/alerts-router.js';
import { router as metricsRouter } from './routes/metrics-router.js';
// More routes will be imported here as they're converted

// Mount routes
app.use('/api/coingecko', coingeckoRouter);
app.use('/api/earthquakes', earthquakesRouter);
app.use('/api/arxiv', arxivRouter);
app.use('/api/hackernews', hackernewsRouter);
app.use('/api/github-trending', githubTrendingRouter);
app.use('/api/fwdstart', fwdstartRouter);
app.use('/api/tech-events', techEventsRouter);
app.use('/api/etf-flows', etfFlowsRouter);
app.use('/api/stablecoin-markets', stablecoinMarketsRouter);
app.use('/api/stock-index', stockIndexRouter);
app.use('/api/hapi', hapiRouter);
app.use('/api/ucdp', ucdpRouter);
app.use('/api/gdelt-doc', gdeltDocRouter);
app.use('/api/gdelt-geo', gdeltGeoRouter);
app.use('/api/risk-scores', riskScoresRouter);
app.use('/api/temporal-baseline', temporalBaselineRouter);
app.use('/api/theater-posture', theaterPostureRouter);
app.use('/api/classify-event', classifyEventRouter);
app.use('/api/finnhub', finnhubRouter);
app.use('/api/fred-data', fredDataRouter);
app.use('/api/eia', eiaRouter);
app.use('/api/acled', acledRouter);
app.use('/api/acled-conflict', acledConflictRouter);
app.use('/api/cloudflare-outages', cloudflareOutagesRouter);
app.use('/api/firms-fires', firesRouter);
app.use('/api/country-intel', countryIntelRouter);
app.use('/api/groq-summarize', groqSummarizeRouter);
app.use('/api/polymarket', polymarketRouter);
app.use('/api/yahoo-finance', yahooFinanceRouter);
app.use('/api/opensky', openskyRouter);
app.use('/api/ais-snapshot', aisSnapshotRouter);
app.use('/api/worldbank', worldbankRouter);
app.use('/api/service-status', serviceStatusRouter);
app.use('/api/macro-signals', macroSignalsRouter);
app.use('/api/rss-proxy', rssProxyRouter);
app.use('/api/youtube-live', youtubeLiveRouter);
app.use('/api/wingbits', wingbitsRouter);
app.use('/api/wingbits', wingbitsBatchRouter);
app.use('/api/wingbits', wingbitsDetailRouter);
app.use('/api/pizzint-dashboard', pizzintDashboardRouter);
app.use('/api/pizzint-gdelt', pizzintGdeltRouter);
app.use('/api/og-story', ogStoryRouter);
app.use('/api/nga-warnings', ngaWarningsRouter);
app.use('/api/faa-status', faaStatusRouter);
app.use('/api/story', storyRouter);
app.use('/api/openrouter-summarize', openrouterSummarizeRouter);
app.use('/api/minimax-summarize', minimaxSummarizeRouter);
app.use('/api/cache-telemetry', cacheTelemetryRouter);
app.use('/api/cache', cacheRouter);
app.use('/api/ai', aiChatRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/podcasts', podcastsRouter);
app.use('/api/rss-collector', rssCollectorRouter);
app.use('/api/source-tiers', sourceTiersRouter);
app.use('/api/web-search', webSearchRouter);
app.use('/api/agent', agentRouter);
app.use('/api/news', newsRouter);
app.use('/api/clusters', newsClustersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/health', healthRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/metrics', metricsRouter);
// ... more routes as converted

// Serve static frontend files from dist/
// In production: /app/dist (Docker)
// In development: ../dist (project root)
const distPath = process.env.NODE_ENV === 'production' ? '/app/dist' : path.join(__dirname, '..', 'dist');

console.log('[Server] Serving static files from:', distPath);

// Serve static files - express handles MIME types automatically
app.use(express.static(distPath));

// Serve /assets/* specifically with correct MIME type
app.use('/assets', express.static(distPath));

// SPA fallback - serve index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Graceful shutdown
const server = app.listen(PORT, async () => {
  console.log(`[Server] WorldMonitor running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize database schema
  try {
    await initializeSchema();
  } catch (err) {
    console.error('[Server] Database schema initialization failed:', err);
  }

  // Seed default job configurations
  try {
    await seedDefaultJobs();
  } catch (err) {
    console.error('[Server] Default jobs seeding failed:', err);
  }

  // Initialize task scheduler
  try {
    initializeScheduler();
    console.log('[Server] Task scheduler initialized');
  } catch (err) {
    console.error('[Server] Task scheduler initialization failed:', err);
  }
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  stopScheduler();
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  stopScheduler();
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

export default app;
