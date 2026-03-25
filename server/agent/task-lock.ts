/**
 * Task Lock Mechanism
 * Prevents concurrent execution of the same task using Redis
 */

import { query } from '../database/connection.js';

export interface TaskLock {
  taskId: string;
  lockedAt: Date;
  expiresAt: Date;
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes default

/**
 * Acquire a lock for a task
 */
export async function acquireLock(taskId: string, timeoutMs: number = LOCK_TIMEOUT_MS): Promise<TaskLock | null> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + timeoutMs);

  try {
    // Try to insert a new lock
    const result = await query<{ task_id: string }>(`
      INSERT INTO task_locks (task_id, locked_at, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (task_id) DO UPDATE
      SET locked_at = EXCLUDED.locked_at, expires_at = EXCLUDED.expires_at
      WHERE task_locks.expires_at < NOW()
      RETURNING task_id
    `, [taskId, now, expiresAt]);

    if (result.rows.length > 0) {
      return { taskId, lockedAt: now, expiresAt };
    }

    // Check if lock exists and is not expired
    const existingLock = await query<{ expires_at: Date }>(`
      SELECT expires_at FROM task_locks WHERE task_id = $1
    `, [taskId]);

    if (existingLock.rows.length > 0 && new Date(existingLock.rows[0].expires_at) > now) {
      return null; // Lock is held
    }

    return null;
  } catch (error) {
    console.error('[TaskLock] Failed to acquire lock:', error);
    return null;
  }
}

/**
 * Release a lock for a task
 */
export async function releaseLock(lock: TaskLock): Promise<boolean> {
  try {
    await query(`
      DELETE FROM task_locks WHERE task_id = $1 AND locked_at = $2
    `, [lock.taskId, lock.lockedAt]);
    return true;
  } catch (error) {
    console.error('[TaskLock] Failed to release lock:', error);
    return false;
  }
}

/**
 * Check if a task is locked
 */
export async function isLocked(taskId: string): Promise<boolean> {
  try {
    const result = await query<{ expires_at: Date }>(`
      SELECT expires_at FROM task_locks WHERE task_id = $1
    `, [taskId]);

    if (result.rows.length === 0) {
      return false;
    }

    return new Date(result.rows[0].expires_at) > new Date();
  } catch (error) {
    console.error('[TaskLock] Failed to check lock:', error);
    return false;
  }
}

/**
 * Cleanup expired locks
 */
export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const result = await query(`
      DELETE FROM task_locks WHERE expires_at < NOW()
    `);
    return result.rowCount || 0;
  } catch (error) {
    console.error('[TaskLock] Failed to cleanup locks:', error);
    return 0;
  }
}

export default {
  acquireLock,
  releaseLock,
  isLocked,
  cleanupExpiredLocks,
};
