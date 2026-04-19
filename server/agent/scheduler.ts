/**
 * Agent Task Scheduler
 * Uses node-cron for scheduled tasks
 */

import cron from 'node-cron';
import { logger } from '../utils/logger.js';

// Scheduled tasks
const scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

/**
 * Initialize scheduled tasks
 */
export function initializeScheduler(): void {
  logger.info('[Scheduler] Initializing task scheduler');

  // RSS Collector - every 30 minutes
  const rssTask = cron.schedule('*/30 * * * *', async () => {
    logger.info('[Scheduler] Running RSS collector');
    try {
      await runRSSCollector();
    } catch (error) {
      logger.error({ err: error }, '[Scheduler] RSS collection failed');
    }
  });
  scheduledTasks.set('rss-collector', rssTask);

  // Daily summary task - 6:00 UTC
  const dailyTask = cron.schedule('0 6 * * *', async () => {
    logger.info('[Scheduler] Running daily summary task');
    try {
      await runDailySummary();
    } catch (error) {
      logger.error({ err: error }, '[Scheduler] Daily summary failed');
    }
  });
  scheduledTasks.set('daily-summary', dailyTask);

  // Weekly trend analysis - Sunday 6:00 UTC
  const weeklyTask = cron.schedule('0 6 * * 0', async () => {
    logger.info('[Scheduler] Running weekly trend analysis');
    try {
      await runWeeklyTrendAnalysis();
    } catch (error) {
      logger.error({ err: error }, '[Scheduler] Weekly trend analysis failed');
    }
  });
  scheduledTasks.set('weekly-trend', weeklyTask);

  // Translation task - every 15 minutes
  const translationTask = cron.schedule('*/15 * * * *', async () => {
    logger.info('[Scheduler] Running translation task');
    try {
      await runTranslation();
    } catch (error) {
      logger.error({ err: error }, '[Scheduler] Translation task failed');
    }
  });
  scheduledTasks.set('translation', translationTask);

  // Cleanup task - daily at 4:00 UTC
  const cleanupTask = cron.schedule('0 4 * * *', async () => {
    logger.info('[Scheduler] Running cleanup task');
    try {
      await runCleanup();
    } catch (error) {
      logger.error({ err: error }, '[Scheduler] Cleanup failed');
    }
  });
  scheduledTasks.set('cleanup', cleanupTask);

  // Backup task - daily at 3:00 UTC
  const backupTask = cron.schedule('0 3 * * *', async () => {
    logger.info('[Scheduler] Running backup task');
    try {
      await runBackup();
    } catch (error) {
      logger.error({ err: error }, '[Scheduler] Backup failed');
    }
  });
  scheduledTasks.set('backup', backupTask);

  logger.info('[Scheduler] All scheduled tasks initialized');
}

/**
 * Stop all scheduled tasks
 */
export function stopScheduler(): void {
  logger.info('[Scheduler] Stopping all tasks');
  for (const [name, task] of scheduledTasks) {
    task.stop();
    logger.info(`[Scheduler] Stopped: ${name}`);
  }
  scheduledTasks.clear();
}

/**
 * Run RSS collector task
 */
async function runRSSCollector(): Promise<void> {
  const { runCollector } = await import('./rss-collector.js');
  await runCollector();
}

/**
 * Run daily summary task (bilingual - zh + en)
 */
async function runDailySummary(): Promise<void> {
  const { generateDailySummary } = await import('./report-generator.js');
  await generateDailySummary('zh', true); // bilingual
}

/**
 * Run weekly trend analysis task (bilingual - zh + en)
 */
async function runWeeklyTrendAnalysis(): Promise<void> {
  const { generateWeeklyTrendBilingual } = await import('./report-generator.js');
  await generateWeeklyTrendBilingual();
}

/**
 * Run cleanup task
 */
async function runCleanup(): Promise<void> {
  const { cleanup } = await import('./cleanup.js');
  await cleanup();
}

/**
 * Run translation task
 */
async function runTranslation(): Promise<void> {
  const { translateNewsBatch, ensureTranslationTable } = await import('../services/translation.js');
  const { query } = await import('../database/connection.js');

  // Ensure translation table exists
  await ensureTranslationTable();

  // Get untranslated items
  const result = await query<{ id: number; title: string; description: string | null }>(`
    SELECT id, title, description
    FROM rss_items
    WHERE title_zh IS NULL
    AND pub_date > NOW() - INTERVAL '7 days'
    LIMIT 50
  `);

  if (result.rows.length > 0) {
    await translateNewsBatch(result.rows, 'zh');
  }
}

/**
 * Run backup task
 */
async function runBackup(): Promise<void> {
  const { runBackup } = await import('./backup.js');
  await runBackup();
}

/**
 * Trigger a task manually
 */
export async function triggerTask(taskName: string): Promise<void> {
  logger.info(`[Scheduler] Manual trigger: ${taskName}`);

  switch (taskName) {
    case 'rss-collector':
      await runRSSCollector();
      break;
    case 'daily-summary':
      await runDailySummary();
      break;
    case 'weekly-trend':
      await runWeeklyTrendAnalysis();
      break;
    case 'cleanup':
      await runCleanup();
      break;
    case 'backup':
      await runBackup();
      break;
    default:
      logger.warn(`[Scheduler] Unknown task: ${taskName}`);
  }
}

export default {
  initializeScheduler,
  stopScheduler,
  triggerTask,
};
