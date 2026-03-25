/**
 * Logs API Router
 * GET /api/logs - List logs
 */

import { Router } from 'express';
import { getLogs, getLogsByTaskId, getLogsBySessionId, getErrorLogs } from '../repositories/log.js';

const router = Router();

/**
 * GET /api/logs
 * List logs with pagination and filters
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 100));

    const filters = {
      taskId: req.query.taskId as string | undefined,
      sessionId: req.query.sessionId as string | undefined,
      level: req.query.level as 'info' | 'warn' | 'error' | 'debug' | undefined,
      fromDate: req.query.from ? new Date(req.query.from as string) : undefined,
      toDate: req.query.to ? new Date(req.query.to as string) : undefined,
    };

    const result = await getLogs(filters, { page, limit });

    res.json({
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('[Logs API] Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/logs/task/:taskId
 * Get logs for specific task
 */
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const logs = await getLogsByTaskId(taskId);
    res.json({ items: logs });
  } catch (error) {
    console.error('[Logs API] Error fetching task logs:', error);
    res.status(500).json({ error: 'Failed to fetch task logs' });
  }
});

/**
 * GET /api/logs/session/:sessionId
 * Get logs for specific session
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const logs = await getLogsBySessionId(sessionId);
    res.json({ items: logs });
  } catch (error) {
    console.error('[Logs API] Error fetching session logs:', error);
    res.status(500).json({ error: 'Failed to fetch session logs' });
  }
});

/**
 * GET /api/logs/errors
 * Get recent error logs
 */
router.get('/errors', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const logs = await getErrorLogs(limit);
    res.json({ items: logs });
  } catch (error) {
    console.error('[Logs API] Error fetching error logs:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

export { router };
export default router;
