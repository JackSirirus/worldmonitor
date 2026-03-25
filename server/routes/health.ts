/**
 * Health Check API
 * Provides system health status
 */

import { Router } from 'express';
import { checkConnection } from '../database/connection.js';
import { query } from '../database/connection.js';
import { getQueueLength, getProcessingCount } from '../agent/task-queue.js';

const router = Router();

/**
 * GET /api/health
 * Full system health check
 */
router.get('/', async (req, res) => {
  const checks: Record<string, unknown> = {};

  // Database check
  try {
    const dbCheck = await checkConnection();
    checks.database = {
      healthy: dbCheck.healthy,
      latency: dbCheck.latency,
    };
  } catch (error) {
    checks.database = {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Get database stats
  try {
    const newsCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM rss_items');
    const sourcesCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM rss_sources');
    const tasksCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM agent_tasks');

    checks.stats = {
      news: parseInt(newsCount.rows[0]?.count || '0', 10),
      sources: parseInt(sourcesCount.rows[0]?.count || '0', 10),
      tasks: parseInt(tasksCount.rows[0]?.count || '0', 10),
    };
  } catch {
    checks.stats = null;
  }

  // Queue check (if Redis available)
  try {
    const queueLength = await getQueueLength('default');
    const processingCount = await getProcessingCount('default');
    checks.queue = {
      pending: queueLength,
      processing: processingCount,
    };
  } catch {
    checks.queue = null;
  }

  // Determine overall status
  const allHealthy = checks.database && (checks.database as { healthy: boolean }).healthy;
  const status = allHealthy ? 'healthy' : 'degraded';

  res.status(allHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

/**
 * GET /api/health/live
 * Liveness probe (is the process running)
 */
router.get('/live', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/health/ready
 * Readiness probe (is the service ready to accept traffic)
 */
router.get('/ready', async (req, res) => {
  try {
    const dbCheck = await checkConnection();
    if (dbCheck.healthy) {
      res.json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'not_ready', reason: 'database not available' });
    }
  } catch {
    res.status(503).json({ status: 'not_ready', reason: 'health check failed' });
  }
});

export { router };
export default router;
