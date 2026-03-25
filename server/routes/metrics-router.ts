/**
 * Metrics Router
 */

import { Router } from 'express';
import { collectMetrics, getMetricsHistory, getLatestMetrics } from '../services/metrics.js';

const router = Router();

/**
 * GET /api/metrics
 * Get current metrics
 */
router.get('/', async (req, res) => {
  try {
    const metrics = await collectMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('[Metrics] Error:', error);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

/**
 * GET /api/metrics/history
 * Get metrics history
 */
router.get('/history', (req, res) => {
  const duration = Math.min(1440, Math.max(1, parseInt(req.query.duration as string) || 60));
  const history = getMetricsHistory(duration);
  res.json({ metrics: history });
});

/**
 * GET /api/metrics/latest
 * Get latest metrics
 */
router.get('/latest', async (req, res) => {
  const latest = getLatestMetrics();
  if (!latest) {
    const metrics = await collectMetrics();
    return res.json(metrics);
  }
  res.json(latest);
});

export { router };
export default router;
