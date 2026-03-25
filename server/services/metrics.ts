/**
 * Metrics Collection Service
 * Simple in-memory metrics for monitoring
 */

import { query } from '../database/connection.js';

export interface Metrics {
  timestamp: number;
  requests: {
    total: number;
    errors: number;
    latency: number;
  };
  database: {
    connections: number;
    queries: number;
    latency: number;
  };
  agents: {
    running: number;
    completed: number;
    failed: number;
  };
  news: {
    total: number;
    new_24h: number;
  };
}

// In-memory metrics storage (ring buffer)
const metricsHistory: Metrics[] = [];
const MAX_HISTORY = 1440; // 24 hours at 1-minute intervals

let requestCount = 0;
let errorCount = 0;
let totalLatency = 0;
let queryCount = 0;
let queryLatency = 0;

/**
 * Record a request
 */
export function recordRequest(latencyMs: number, isError: boolean = false): void {
  requestCount++;
  totalLatency += latencyMs;
  if (isError) errorCount++;
}

/**
 * Record a database query
 */
export function recordQuery(latencyMs: number): void {
  queryCount++;
  queryLatency += latencyMs;
}

/**
 * Collect current metrics
 */
export async function collectMetrics(): Promise<Metrics> {
  const now = Date.now();

  // Get database metrics
  let dbConnections = 0;
  let dbLatency = 0;
  try {
    const start = Date.now();
    const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM pg_stat_activity');
    dbConnections = parseInt(result.rows[0]?.count || '0', 10);
    dbLatency = Date.now() - start;
  } catch {
    // Ignore
  }

  // Get agent stats
  let running = 0, completed = 0, failed = 0;
  try {
    const result = await query<{ status: string; count: string }>(`
      SELECT status, COUNT(*) as count FROM agent_tasks
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);
    for (const row of result.rows) {
      if (row.status === 'running') running = parseInt(row.count, 10);
      else if (row.status === 'completed') completed = parseInt(row.count, 10);
      else if (row.status === 'failed') failed = parseInt(row.count, 10);
    }
  } catch {
    // Ignore
  }

  // Get news stats
  let newsTotal = 0, news24h = 0;
  try {
    const total = await query<{ count: string }>('SELECT COUNT(*) as count FROM rss_items');
    newsTotal = parseInt(total.rows[0]?.count || '0', 10);

    const recent = await query<{ count: string }>(`
      SELECT COUNT(*) as count FROM rss_items
      WHERE fetched_at > NOW() - INTERVAL '24 hours'
    `);
    news24h = parseInt(recent.rows[0]?.count || '0', 10);
  } catch {
    // Ignore
  }

  const metrics: Metrics = {
    timestamp: now,
    requests: {
      total: requestCount,
      errors: errorCount,
      latency: requestCount > 0 ? Math.round(totalLatency / requestCount) : 0,
    },
    database: {
      connections: dbConnections,
      queries: queryCount,
      latency: queryCount > 0 ? Math.round(queryLatency / queryCount) : dbLatency,
    },
    agents: {
      running,
      completed,
      failed,
    },
    news: {
      total: newsTotal,
      new_24h: news24h,
    },
  };

  // Add to history
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }

  // Reset counters
  requestCount = 0;
  errorCount = 0;
  totalLatency = 0;
  queryCount = 0;
  queryLatency = 0;

  return metrics;
}

/**
 * Get metrics history
 */
export function getMetricsHistory(duration: number = 60): Metrics[] {
  return metricsHistory.slice(-duration);
}

/**
 * Get latest metrics
 */
export function getLatestMetrics(): Metrics | null {
  return metricsHistory[metricsHistory.length - 1] || null;
}

export default {
  recordRequest,
  recordQuery,
  collectMetrics,
  getMetricsHistory,
  getLatestMetrics,
};
