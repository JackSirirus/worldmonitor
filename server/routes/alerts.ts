/**
 * Alerting Service
 * Basic alerting for monitoring
 */

import { query } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export interface Alert {
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

const ALERTS: Alert[] = [
  { name: 'high_error_rate', condition: 'errors > threshold', threshold: 10, enabled: true },
  { name: 'high_task_queue', condition: 'pending_tasks > threshold', threshold: 100, enabled: true },
  { name: 'database_slow', condition: 'db_latency > threshold', threshold: 1000, enabled: true },
  { name: 'disk_space_low', condition: 'disk_free < threshold', threshold: 10, enabled: false },
];

/**
 * Check all alerts
 */
export async function checkAlerts(): Promise<Array<{ name: string; triggered: boolean; value: number; threshold: number }>> {
  const results: Array<{ name: string; triggered: boolean; value: number; threshold: number }> = [];

  for (const alert of ALERTS) {
    if (!alert.enabled) continue;

    try {
      const result = await checkAlert(alert);
      results.push(result);
    } catch (error) {
      logger.warn({ alert: alert.name, error }, '[Alerts] Check failed');
    }
  }

  return results;
}

/**
 * Check individual alert
 */
async function checkAlert(alert: Alert): Promise<{ name: string; triggered: boolean; value: number; threshold: number }> {
  let value = 0;

  switch (alert.name) {
    case 'high_error_rate': {
      const result = await query<{ count: string }>(`
        SELECT COUNT(*) as count FROM task_logs
        WHERE level = 'error' AND timestamp > NOW() - INTERVAL '1 hour'
      `);
      value = parseInt(result.rows[0]?.count || '0', 10);
      break;
    }

    case 'high_task_queue': {
      const result = await query<{ count: string }>(`
        SELECT COUNT(*) as count FROM agent_tasks WHERE status = 'pending'
      `);
      value = parseInt(result.rows[0]?.count || '0', 10);
      break;
    }

    case 'database_slow': {
      const start = Date.now();
      await query('SELECT 1');
      value = Date.now() - start;
      break;
    }

    default:
      value = 0;
  }

  return {
    name: alert.name,
    triggered: value > alert.threshold,
    value,
    threshold: alert.threshold,
  };
}

/**
 * Send alert notification
 */
export async function sendAlertNotification(alert: { name: string; triggered: boolean; value: number; threshold: number }): Promise<void> {
  if (!alert.triggered) return;

  const message = `[${alert.name}] Alert triggered: ${alert.value} (threshold: ${alert.threshold})`;

  logger.warn({ alert: alert.name, value: alert.value, threshold: alert.threshold }, message);

  // Could integrate with PagerDuty, Slack, Email, etc.
  // For now, just log
  console.log(`[ALERT] ${message}`);
}

/**
 * Get all alerts status
 */
export function getAlerts(): Alert[] {
  return ALERTS;
}

export default {
  checkAlerts,
  sendAlertNotification,
  getAlerts,
};
