/**
 * Task Logger - Append-only logging system
 */

import { query } from '../database/connection.js';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  taskId: string;
  sessionId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Write a log entry
 */
export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await query(`
      INSERT INTO task_logs (task_id, session_id, level, message, context)
      VALUES ($1, $2, $3, $4, $5)
    `, [entry.taskId, entry.sessionId, entry.level, entry.message, JSON.stringify(entry.context || {})]);
  } catch (error) {
    console.error('[TaskLogger] Failed to write log:', error);
  }
}

/**
 * Write info log
 */
export function info(taskId: string, sessionId: string, message: string, context?: Record<string, unknown>): void {
  writeLog({ taskId, sessionId, level: 'info', message, context });
}

/**
 * Write warn log
 */
export function warn(taskId: string, sessionId: string, message: string, context?: Record<string, unknown>): void {
  writeLog({ taskId, sessionId, level: 'warn', message, context });
}

/**
 * Write error log
 */
export function error(taskId: string, sessionId: string, message: string, context?: Record<string, unknown>): void {
  writeLog({ taskId, sessionId, level: 'error', message, context });
}

/**
 * Write debug log
 */
export function debug(taskId: string, sessionId: string, message: string, context?: Record<string, unknown>): void {
  writeLog({ taskId, sessionId, level: 'debug', message, context });
}

/**
 * Get logs for a task
 */
export async function getTaskLogs(taskId: string, limit: number = 100): Promise<LogEntry[]> {
  const result = await query<{
    task_id: string;
    session_id: string;
    level: LogLevel;
    message: string;
    context: string;
    timestamp: Date;
  }>(`
    SELECT task_id, session_id, level, message, context, timestamp
    FROM task_logs
    WHERE task_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `, [taskId, limit]);

  return result.rows.map(row => ({
    taskId: row.task_id,
    sessionId: row.session_id,
    level: row.level,
    message: row.message,
    context: row.context ? JSON.parse(row.context) : undefined,
  }));
}

export default {
  writeLog,
  info,
  warn,
  error,
  debug,
  getTaskLogs,
};
