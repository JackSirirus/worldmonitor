/**
 * Task Repository
 * Handles data access for agent_tasks table
 */

import { query } from '../database/connection.js';

export interface Task {
  id: number;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  params: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskFilters {
  type?: string;
  status?: Task['status'];
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Get paginated tasks
 */
export async function getTasks(
  filters: TaskFilters = {},
  pagination: PaginationParams = { page: 1, limit: 50 }
): Promise<{ items: Task[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.type) {
    conditions.push(`task_type = $${paramIndex++}`);
    params.push(filters.type);
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.fromDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.toDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (pagination.page - 1) * pagination.limit;

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM agent_tasks ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get items
  const itemsResult = await query<Task>(
    `SELECT * FROM agent_tasks ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, pagination.limit, offset]
  );

  return {
    items: itemsResult.rows,
    total,
  };
}

/**
 * Get task by ID
 */
export async function getTaskById(id: number): Promise<Task | null> {
  const result = await query<Task>(
    'SELECT * FROM agent_tasks WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new task
 */
export async function createTask(task: {
  task_type: string;
  params?: Record<string, unknown>;
}): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO agent_tasks (task_type, status, params)
     VALUES ($1, 'pending', $2)
     RETURNING id`,
    [task.task_type, task.params || null]
  );
  return result.rows[0].id;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  id: number,
  status: Task['status'],
  errorMessage?: string
): Promise<boolean> {
  let result;

  if (status === 'running') {
    result = await query(
      `UPDATE agent_tasks
       SET status = $1, started_at = NOW(), error_message = $2
       WHERE id = $3`,
      [status, errorMessage || null, id]
    );
  } else if (status === 'completed' || status === 'failed') {
    result = await query(
      `UPDATE agent_tasks
       SET status = $1, completed_at = NOW(), error_message = $2
       WHERE id = $3`,
      [status, errorMessage || null, id]
    );
  } else {
    result = await query(
      `UPDATE agent_tasks SET status = $1, error_message = $2 WHERE id = $3`,
      [status, errorMessage || null, id]
    );
  }

  return (result.rowCount || 0) > 0;
}

/**
 * Update task result
 */
export async function updateTaskResult(
  id: number,
  result: Record<string, unknown>
): Promise<boolean> {
  const queryResult = await query(
    'UPDATE agent_tasks SET result = $1 WHERE id = $2',
    [result, id]
  );
  return (queryResult.rowCount || 0) > 0;
}

/**
 * Delete a task
 */
export async function deleteTask(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM agent_tasks WHERE id = $1',
    [id]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Get running tasks
 */
export async function getRunningTasks(): Promise<Task[]> {
  const result = await query<Task>(
    "SELECT * FROM agent_tasks WHERE status = 'running' ORDER BY started_at DESC"
  );
  return result.rows;
}

/**
 * Get pending tasks
 */
export async function getPendingTasks(): Promise<Task[]> {
  const result = await query<Task>(
    "SELECT * FROM agent_tasks WHERE status = 'pending' ORDER BY created_at ASC"
  );
  return result.rows;
}

/**
 * Get task statistics
 */
export async function getTaskStats(): Promise<{
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}> {
  const result = await query<{
    status: string;
    count: string;
  }>('SELECT status, COUNT(*) as count FROM agent_tasks GROUP BY status');

  const stats = {
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };

  for (const row of result.rows) {
    const count = parseInt(row.count, 10);
    stats.total += count;
    if (row.status === 'pending') stats.pending = count;
    else if (row.status === 'running') stats.running = count;
    else if (row.status === 'completed') stats.completed = count;
    else if (row.status === 'failed') stats.failed = count;
  }

  return stats;
}

/**
 * Delete old tasks
 */
export async function deleteOldTasks(olderThan: Date): Promise<number> {
  const result = await query<{ count: string }>(
    'DELETE FROM agent_tasks WHERE created_at < $1 AND status IN (completed, failed) RETURNING COUNT(*) as count',
    [olderThan]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTaskResult,
  deleteTask,
  getRunningTasks,
  getPendingTasks,
  getTaskStats,
  deleteOldTasks,
};
