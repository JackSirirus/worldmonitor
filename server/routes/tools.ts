/**
 * Tools (Jobs) API Router
 * GET /api/tools - List tools/jobs
 * POST /api/tools - Create a new tool
 * PUT /api/tools/:id - Update a tool
 * DELETE /api/tools/:id - Delete a tool
 */

import { Router } from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, setJobEnabled, toggleJob } from '../repositories/tool.js';

const router = Router();

/**
 * GET /api/tools
 * List all jobs
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined,
      executionMode: req.query.mode as string | undefined,
    };

    const jobs = await getJobs(filters);
    res.json({ items: jobs });
  } catch (error) {
    console.error('[Tools API] Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

/**
 * GET /api/tools/enabled
 * List enabled jobs
 */
router.get('/enabled', async (req, res) => {
  try {
    const jobs = await getJobs({ enabled: true });
    res.json({ items: jobs });
  } catch (error) {
    console.error('[Tools API] Error fetching enabled jobs:', error);
    res.status(500).json({ error: 'Failed to fetch enabled tools' });
  }
});

/**
 * GET /api/tools/:id
 * Get job by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await getJobById(id);

    if (!job) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('[Tools API] Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
});

/**
 * POST /api/tools
 * Create a new job
 */
router.post('/', async (req, res) => {
  try {
    const { id, name, schedule, payload, executionMode, maxConcurrent, timeout, retryPolicy } = req.body;

    if (!id || !name || !schedule || !payload) {
      return res.status(400).json({
        error: 'Missing required fields: id, name, schedule, payload'
      });
    }

    // Validate schedule format (basic cron validation)
    const cronParts = schedule.split(' ');
    if (cronParts.length < 5 || cronParts.length > 6) {
      return res.status(400).json({ error: 'Invalid cron schedule format' });
    }

    await createJob({
      id,
      name,
      schedule,
      payload,
      executionMode,
      maxConcurrent,
      timeout,
      retryPolicy,
    });

    res.status(201).json({
      id,
      name,
      schedule,
      message: 'Tool created successfully'
    });
  } catch (error) {
    if ((error as Error).message?.includes('duplicate')) {
      return res.status(409).json({ error: 'Tool with this ID already exists' });
    }
    console.error('[Tools API] Error creating job:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

/**
 * PUT /api/tools/:id
 * Update a job
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, schedule, enabled, executionMode, payload, maxConcurrent, timeout, retryPolicy } = req.body;

    const existing = await getJobById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const updated = await updateJob(id, {
      name,
      schedule,
      enabled,
      execution_mode: executionMode,
      payload,
      max_concurrent: maxConcurrent,
      timeout,
      retry_policy: retryPolicy,
    });

    if (!updated) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updatedJob = await getJobById(id);
    res.json(updatedJob);
  } catch (error) {
    console.error('[Tools API] Error updating job:', error);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

/**
 * PATCH /api/tools/:id/toggle
 * Toggle job enabled/disabled
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await toggleJob(id);

    if (result === null) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
      id,
      enabled: result,
      message: `Tool ${result ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('[Tools API] Error toggling job:', error);
    res.status(500).json({ error: 'Failed to toggle tool' });
  }
});

/**
 * PATCH /api/tools/:id/enable
 * Enable a job
 */
router.patch('/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await setJobEnabled(id, true);

    if (!result) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
      id,
      enabled: true,
      message: 'Tool enabled successfully'
    });
  } catch (error) {
    console.error('[Tools API] Error enabling job:', error);
    res.status(500).json({ error: 'Failed to enable tool' });
  }
});

/**
 * PATCH /api/tools/:id/disable
 * Disable a job
 */
router.patch('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await setJobEnabled(id, false);

    if (!result) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
      id,
      enabled: false,
      message: 'Tool disabled successfully'
    });
  } catch (error) {
    console.error('[Tools API] Error disabling job:', error);
    res.status(500).json({ error: 'Failed to disable tool' });
  }
});

/**
 * DELETE /api/tools/:id
 * Delete a job
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getJobById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const deleted = await deleteJob(id);

    if (!deleted) {
      return res.status(400).json({ error: 'Failed to delete tool' });
    }

    res.json({
      id,
      message: 'Tool deleted successfully'
    });
  } catch (error) {
    console.error('[Tools API] Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

export { router };
export default router;
