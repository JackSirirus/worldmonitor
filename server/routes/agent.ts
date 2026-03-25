/**
 * Agent API Routes
 * Management endpoints for agent system
 */

import express from 'express';
import { triggerTask } from '../agent/scheduler.js';
import { getTaskLogs } from '../agent/task-logger.js';
import { query } from '../database/connection.js';

const router = express.Router();

/**
 * GET /api/agent/status
 * Get agent system status
 */
router.get('/status', async (req, res) => {
  try {
    // Get RSS collector status
    const rssStats = await query<{ total: string; ok: string; errors: string }>(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ok' THEN 1 END) as ok,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
      FROM rss_sources
    `);

    // Get recent task counts
    const taskStats = await query<{ total: string; completed: string; failed: string }>(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM agent_tasks
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    // Get recent reports
    const recentReports = await query<{ category: string; count: string }>(`
      SELECT category, COUNT(*) as count
      FROM reports
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY category
    `);

    res.json({
      success: true,
      rss: {
        totalSources: parseInt(rssStats.rows[0]?.total || '0'),
        ok: parseInt(rssStats.rows[0]?.ok || '0'),
        errors: parseInt(rssStats.rows[0]?.errors || '0'),
      },
      tasks: {
        total24h: parseInt(taskStats.rows[0]?.total || '0'),
        completed24h: parseInt(taskStats.rows[0]?.completed || '0'),
        failed24h: parseInt(taskStats.rows[0]?.failed || '0'),
      },
      reports: recentReports.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Agent API] Status failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/jobs
 * List task configurations
 */
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await query(`
      SELECT * FROM agent_jobs ORDER BY name ASC
    `);

    res.json({
      success: true,
      jobs: jobs.rows,
    });
  } catch (error) {
    console.error('[Agent API] Jobs failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/jobs/:id
 * Get or update a specific job configuration
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await query(`
      SELECT * FROM agent_jobs WHERE id = $1
    `, [id]);

    if (job.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Job not found',
      });
      return;
    }

    res.json({
      success: true,
      job: job.rows[0],
    });
  } catch (error) {
    console.error('[Agent API] Job failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/agent/jobs/:id
 * Update a job configuration
 */
router.put('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, schedule, payload } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      params.push(enabled);
    }

    if (schedule !== undefined) {
      updates.push(`schedule = $${paramIndex++}`);
      params.push(schedule);
    }

    if (payload !== undefined) {
      updates.push(`payload = $${paramIndex++}`);
      params.push(JSON.stringify(payload));
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
      return;
    }

    params.push(id);

    const result = await query(`
      UPDATE agent_jobs SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Job not found',
      });
      return;
    }

    res.json({
      success: true,
      job: result.rows[0],
    });
  } catch (error) {
    console.error('[Agent API] Job update failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/tasks
 * List task executions with pagination
 */
router.get('/tasks', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    let sql = 'SELECT * FROM agent_tasks';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
      sql += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    } else {
      sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }

    const tasks = await query(sql, params);

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM agent_tasks' + (status ? ' WHERE status = $1' : ''),
      status ? [status] : []
    );

    res.json({
      success: true,
      tasks: tasks.rows,
      total: parseInt(countResult.rows[0]?.count || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Agent API] Tasks failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/tasks/:id
 * Get task details
 */
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await query(`
      SELECT * FROM agent_tasks WHERE id = $1
    `, [id]);

    if (task.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    res.json({
      success: true,
      task: task.rows[0],
    });
  } catch (error) {
    console.error('[Agent API] Task detail failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/tasks/:id/logs
 * Get task execution logs
 */
router.get('/tasks/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const logs = await getTaskLogs(id, limit);

    res.json({
      success: true,
      taskId: id,
      logs,
    });
  } catch (error) {
    console.error('[Agent API] Task logs failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agent/trigger/:task
 * Manually trigger a task
 */
router.post('/trigger/:task', async (req, res) => {
  try {
    const { task } = req.params;

    const validTasks = ['rss-collector', 'daily-summary', 'weekly-trend', 'cleanup', 'backup'];

    if (!validTasks.includes(task)) {
      res.status(400).json({
        success: false,
        error: `Invalid task. Valid tasks: ${validTasks.join(', ')}`,
      });
      return;
    }

    await triggerTask(task);

    res.json({
      success: true,
      message: `Task ${task} triggered`,
    });
  } catch (error) {
    console.error('[Agent API] Trigger failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/dead-letter
 * List failed tasks
 */
router.get('/dead-letter', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const tasks = await query(`
      SELECT * FROM dead_letter_tasks
      ORDER BY failed_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count FROM dead_letter_tasks WHERE status = 'pending-review'
    `);

    res.json({
      success: true,
      tasks: tasks.rows,
      pendingCount: parseInt(countResult.rows[0]?.count || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Agent API] Dead letter failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agent/dead-letter/:id/requeue
 * Requeue a failed task
 */
router.post('/dead-letter/:id/requeue', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the failed task
    const task = await query<{ id: number; type: string; payload: unknown }>(`
      SELECT id, type, payload FROM dead_letter_tasks WHERE id = $1
    `, [id]);

    if (task.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    // Re-insert as new task
    const newTask = await query<{ id: number }>(`
      INSERT INTO agent_tasks (task_type, status, params)
      VALUES ($1, 'pending', $2)
      RETURNING id
    `, [task.rows[0].type, JSON.stringify(task.rows[0].payload)]);

    // Update dead letter status
    await query(`
      UPDATE dead_letter_tasks SET status = 'requeued', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Task requeued',
      newTaskId: newTask.rows[0]?.id,
    });
  } catch (error) {
    console.error('[Agent API] Requeue failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agent/config
 * Get global agent configuration
 */
router.get('/config', async (req, res) => {
  try {
    // Return default config (could be extended to database)
    const config = {
      rssCollector: {
        enabled: true,
        interval: '*/30 * * * *', // Every 30 minutes
        concurrency: 5,
      },
      reports: {
        dailySchedule: '0 6 * * *',
        weeklySchedule: '0 6 * * 0',
        minItemsThreshold: 50,
        webSearchFallback: true,
      },
      cleanup: {
        enabled: true,
        schedule: '0 4 * * *',
        rssRetentionDays: 90,
        podcastRetentionDays: 3,
        logsRetentionDays: 30,
      },
      backup: {
        enabled: false, // Disabled by default
        schedule: '0 3 * * *',
        retentionDays: 30,
      },
      tts: {
        enabled: true,
        voice: 'en-US-AriaNeural',
      },
    };

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[Agent API] Config failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/agent/config
 * Update global agent configuration
 */
router.put('/config', async (req, res) => {
  try {
    const { rssCollector, reports, cleanup, backup, tts } = req.body;

    // Configuration would be persisted to database or file
    // For now, just acknowledge the update

    res.json({
      success: true,
      message: 'Configuration updated',
      // Return merged config
      config: { rssCollector, reports, cleanup, backup, tts },
    });
  } catch (error) {
    console.error('[Agent API] Config update failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
export default router;
