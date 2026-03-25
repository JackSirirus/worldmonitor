/**
 * Tasks API Router
 * GET /api/tasks - List tasks
 * GET /api/tasks/:id - Get task by ID
 * POST /api/tasks/trigger - Trigger a new task
 */

import { Router } from 'express';
import { getTasks, getTaskById, createTask, getTaskStats, getRunningTasks } from '../repositories/task.js';

const router = Router();

/**
 * GET /api/tasks
 * List tasks with pagination and filters
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const filters = {
      type: req.query.type as string | undefined,
      status: req.query.status as 'pending' | 'running' | 'completed' | 'failed' | undefined,
      fromDate: req.query.from ? new Date(req.query.from as string) : undefined,
      toDate: req.query.to ? new Date(req.query.to as string) : undefined,
    };

    const result = await getTasks(filters, { page, limit });

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
    console.error('[Tasks API] Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/stats
 * Get task statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getTaskStats();
    res.json(stats);
  } catch (error) {
    console.error('[Tasks API] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
});

/**
 * GET /api/tasks/running
 * Get currently running tasks
 */
router.get('/running', async (req, res) => {
  try {
    const tasks = await getRunningTasks();
    res.json({ items: tasks });
  } catch (error) {
    console.error('[Tasks API] Error fetching running tasks:', error);
    res.status(500).json({ error: 'Failed to fetch running tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await getTaskById(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('[Tasks API] Error fetching task by id:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { type, params } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Task type is required' });
    }

    const validTypes = ['summary', 'trend', 'report', 'podcast', 'rss-collect', 'translate', 'cleanup'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid task type',
        validTypes
      });
    }

    const taskId = await createTask({
      task_type: type,
      params: params || {},
    });

    res.status(201).json({
      id: taskId,
      type,
      status: 'pending',
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('[Tasks API] Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * POST /api/tasks/trigger
 * Trigger a new task (alias for POST /api/tasks)
 */
router.post('/trigger', async (req, res) => {
  try {
    const { type, params } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Task type is required' });
    }

    const taskId = await createTask({
      task_type: type,
      params: params || {},
    });

    // Note: In a real implementation, this would also trigger the task processor
    // For now, we just create the task and let the scheduler pick it up

    res.status(201).json({
      id: taskId,
      type,
      status: 'pending',
      message: 'Task triggered successfully'
    });
  } catch (error) {
    console.error('[Tasks API] Error triggering task:', error);
    res.status(500).json({ error: 'Failed to trigger task' });
  }
});

export { router };
export default router;
