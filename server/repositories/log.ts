/**
 * Log Repository
 * Handles data access for task_logs table
 */

import { query } from '../database/connection.js';

export interface TaskLog {
  id: number;
  task_id: string;
  session_id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: Record<string, unknown> | null;
}

export interface LogFilters {
  taskId?: string;
  sessionId?: string;
  level?: TaskLog['level'];
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Get paginated logs
 */
export async function getLogs(
  filters: LogFilters = {},
  pagination: PaginationParams = { page: 1, limit: 100 }
): Promise<{ items: TaskLog[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.taskId) {
    conditions.push(`task_id = $${paramIndex++}`);
    params.push(filters.taskId);
  }

  if (filters.sessionId) {
    conditions.push(`session_id = $${paramIndex++}`);
    params.push(filters.sessionId);
  }

  if (filters.level) {
    conditions.push(`level = $${paramIndex++}`);
    params.push(filters.level);
  }

  if (filters.fromDate) {
    conditions.push(`timestamp >= $${paramIndex++}`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`timestamp <= $${paramIndex++}`);
    params.push(filters.toDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (pagination.page - 1) * pagination.limit;

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM task_logs ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get items
  const itemsResult = await query<TaskLog>(
    `SELECT * FROM task_logs ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, pagination.limit, offset]
  );

  return {
    items: itemsResult.rows,
    total,
  };
}

/**
 * Get logs for a specific task
 */
export async function getLogsByTaskId(taskId: string): Promise<TaskLog[]> {
  const result = await query<TaskLog>(
    'SELECT * FROM task_logs WHERE task_id = $1 ORDER BY timestamp ASC',
    [taskId]
  );
  return result.rows;
}

/**
 * Get logs for a specific session
 */
export async function getLogsBySessionId(sessionId: string): Promise<TaskLog[]> {
  const result = await query<TaskLog>(
    'SELECT * FROM task_logs WHERE session_id = $1 ORDER BY timestamp DESC',
    [sessionId]
  );
  return result.rows;
}

/**
 * Create a new log entry
 */
export async function createLog(log: {
  task_id: string;
  session_id: string;
  level: TaskLog['level'];
  message: string;
  context?: Record<string, unknown>;
}): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO task_logs (task_id, session_id, level, message, context)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [log.task_id, log.session_id, log.level, log.message, log.context || null]
  );
  return result.rows[0].id;
}

/**
 * Batch create log entries (for performance)
 */
export async function batchCreateLogs(logs: Array<{
  task_id: string;
  session_id: string;
  level: TaskLog['level'];
  message: string;
  context?: Record<string, unknown>;
}>): Promise<number> {
  if (logs.length === 0) return 0;

  let inserted = 0;

  for (const log of logs) {
    await createLog(log);
    inserted++;
  }

  return inserted;
}

/**
 * Delete logs for a specific task
 */
export async function deleteLogsByTaskId(taskId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'DELETE FROM task_logs WHERE task_id = $1 RETURNING COUNT(*) as count',
    [taskId]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Delete logs older than specified date
 */
export async function deleteOldLogs(olderThan: Date): Promise<number> {
  const result = await query<{ count: string }>(
    'DELETE FROM task_logs WHERE timestamp < $1 RETURNING COUNT(*) as count',
    [olderThan]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get log count
 */
export async function getLogCount(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM task_logs');
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get distinct session IDs
 */
export async function getSessionIds(limit: number = 100): Promise<string[]> {
  const result = await query<{ session_id: string }>(
    `SELECT DISTINCT session_id FROM task_logs
     ORDER BY MAX(timestamp) DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(r => r.session_id);
}

/**
 * Get error logs
 */
export async function getErrorLogs(limit: number = 100): Promise<TaskLog[]> {
  const result = await query<TaskLog>(
    "SELECT * FROM task_logs WHERE level = 'error' ORDER BY timestamp DESC LIMIT $1",
    [limit]
  );
  return result.rows;
}

export default {
  getLogs,
  getLogsByTaskId,
  getLogsBySessionId,
  createLog,
  batchCreateLogs,
  deleteLogsByTaskId,
  deleteOldLogs,
  getLogCount,
  getSessionIds,
  getErrorLogs,
};
