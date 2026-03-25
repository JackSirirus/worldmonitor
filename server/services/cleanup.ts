/**
 * Cleanup Service
 * Handles periodic cleanup of old data
 */

import { deleteOldNews } from '../repositories/news.js';
import { deleteOldReports } from '../repositories/report.js';
import { deleteOldTasks } from '../repositories/task.js';
import { deleteOldLogs } from '../repositories/log.js';
import { info, warn, error } from '../agent/task-logger.js';

export interface CleanupResult {
  news: number;
  reports: number;
  tasks: number;
  logs: number;
  total: number;
}

export interface CleanupConfig {
  newsRetentionDays: number;
  reportRetentionDays: number;
  taskRetentionDays: number;
  logRetentionDays: number;
}

const DEFAULT_CONFIG: CleanupConfig = {
  newsRetentionDays: 60,  // 2 months
  reportRetentionDays: 30, // 1 month
  taskRetentionDays: 7,   // 1 week
  logRetentionDays: 3,    // 3 days
};

/**
 * Calculate cutoff date from retention days
 */
function getCutoffDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Run cleanup for all data types
 */
export async function runCleanup(config: CleanupConfig = DEFAULT_CONFIG): Promise<CleanupResult> {
  const sessionId = `cleanup-${Date.now()}`;
  info(sessionId, sessionId, 'Starting cleanup task');

  const result: CleanupResult = {
    news: 0,
    reports: 0,
    tasks: 0,
    logs: 0,
    total: 0,
  };

  try {
    // Clean old news
    const newsCutoff = getCutoffDate(config.newsRetentionDays);
    result.news = await deleteOldNews(newsCutoff);
    info(sessionId, sessionId, `Cleaned ${result.news} old news items`);

    // Clean old reports
    const reportCutoff = getCutoffDate(config.reportRetentionDays);
    result.reports = await deleteOldReports(reportCutoff);
    info(sessionId, sessionId, `Cleaned ${result.reports} old reports`);

    // Clean old completed/failed tasks
    const taskCutoff = getCutoffDate(config.taskRetentionDays);
    result.tasks = await deleteOldTasks(taskCutoff);
    info(sessionId, sessionId, `Cleaned ${result.tasks} old tasks`);

    // Clean old logs
    const logCutoff = getCutoffDate(config.logRetentionDays);
    result.logs = await deleteOldLogs(logCutoff);
    info(sessionId, sessionId, `Cleaned ${result.logs} old log entries`);

    result.total = result.news + result.reports + result.tasks + result.logs;

    info(sessionId, sessionId, `Cleanup complete: ${result.total} items deleted`);
  } catch (err) {
    error(sessionId, sessionId, `Cleanup failed: ${err}`);
    throw err;
  }

  return result;
}

/**
 * Quick cleanup (only old logs)
 */
export async function quickCleanup(): Promise<number> {
  const logCutoff = getCutoffDate(DEFAULT_CONFIG.logRetentionDays);
  return await deleteOldLogs(logCutoff);
}

/**
 * Full cleanup with custom config
 */
export async function fullCleanup(customConfig?: Partial<CleanupConfig>): Promise<CleanupResult> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  return await runCleanup(config);
}

export default {
  runCleanup,
  quickCleanup,
  fullCleanup,
  DEFAULT_CONFIG,
};
