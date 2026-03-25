/**
 * Data Cleanup Service
 * Handles automatic cleanup of old data
 */

import { query } from '../database/connection.js';
import { logger } from '../utils/logger.js';

const RSS_RETENTION_DAYS = parseInt(process.env.RSS_RETENTION_DAYS || '90');
const PODCAST_RETENTION_DAYS = parseInt(process.env.PODCAST_RETENTION_DAYS || '3');
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '30');

/**
 * Run cleanup task
 */
export async function cleanup(): Promise<void> {
  logger.info('[Cleanup] Starting cleanup task');

  const results: Record<string, number> = {};

  // Count before delete - RSS items
  const rssCount = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM rss_items
    WHERE fetched_at < NOW() - INTERVAL '1 day' * $1
  `, [RSS_RETENTION_DAYS]);
  results.rssItems = parseInt(rssCount.rows[0]?.count || '0');

  // Delete old RSS items
  await query(`
    DELETE FROM rss_items
    WHERE fetched_at < NOW() - INTERVAL '1 day' * $1
  `, [RSS_RETENTION_DAYS]);

  // Count before delete - podcasts
  const podcastCount = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM podcasts
    WHERE created_at < NOW() - INTERVAL '1 day' * $1
  `, [PODCAST_RETENTION_DAYS]);
  results.podcasts = parseInt(podcastCount.rows[0]?.count || '0');

  // Delete old podcasts
  await query(`
    DELETE FROM podcasts
    WHERE created_at < NOW() - INTERVAL '1 day' * $1
  `, [PODCAST_RETENTION_DAYS]);

  // Count before delete - orphan RSS items
  const orphanCount = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM rss_items i
    WHERE NOT EXISTS (
      SELECT 1 FROM rss_sources s WHERE s.url = i.source_url
    )
  `);
  results.orphanItems = parseInt(orphanCount.rows[0]?.count || '0');

  // Delete orphan RSS items
  await query(`
    DELETE FROM rss_items i
    WHERE NOT EXISTS (
      SELECT 1 FROM rss_sources s WHERE s.url = i.source_url
    )
  `);

  // Clean old task logs
  const logCount = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM task_logs
    WHERE timestamp < NOW() - INTERVAL '1 day' * $1
  `, [LOG_RETENTION_DAYS]);
  results.taskLogs = parseInt(logCount.rows[0]?.count || '0');

  await query(`
    DELETE FROM task_logs
    WHERE timestamp < NOW() - INTERVAL '1 day' * $1
  `, [LOG_RETENTION_DAYS]);

  // Clean expired task locks
  const lockCount = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM task_locks
    WHERE expires_at < NOW()
  `);
  results.expiredLocks = parseInt(lockCount.rows[0]?.count || '0');

  await query(`DELETE FROM task_locks WHERE expires_at < NOW()`);

  logger.info({ results }, '[Cleanup] Cleanup completed');
}

export default { cleanup };
