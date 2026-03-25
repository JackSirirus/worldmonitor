/**
 * Alerts Router
 */

import { Router } from 'express';
import { checkAlerts, getAlerts } from './alerts.js';

const router = Router();

/**
 * GET /api/alerts
 * Get alert statuses
 */
router.get('/', async (req, res) => {
  try {
    const alerts = getAlerts();
    const status = await checkAlerts();
    res.json({ alerts, status });
  } catch (error) {
    console.error('[Alerts] Error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * GET /api/alerts/status
 * Get only alert statuses
 */
router.get('/status', async (req, res) => {
  try {
    const status = await checkAlerts();
    res.json({ status });
  } catch (error) {
    console.error('[Alerts] Error:', error);
    res.status(500).json({ error: 'Failed to get alert status' });
  }
});

export { router };
export default router;
