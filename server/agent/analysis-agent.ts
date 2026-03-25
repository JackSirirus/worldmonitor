/**
 * Data Analysis Agent
 * Analyzes collected news data for trends and patterns
 */

import { Agent } from './agent-base.js';
import { query } from '../database/connection.js';
import { broadcastAgentStatus } from './websocket-server.js';

export interface AnalysisResult {
  category: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  avgDaily: number;
  sources: string[];
}

/**
 * Data Analysis Agent
 */
export class DataAnalysisAgent extends Agent {
  constructor() {
    super({
      name: 'data-analysis',
      description: 'Analyzes news data for trends and patterns',
      timeout: 300000,
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    this.reportProgress(10, 'Analyzing news data...');

    // Get category distribution
    const categoryStats = await this.getCategoryStats();
    this.reportProgress(30, 'Category analysis complete');

    // Get source distribution
    const sourceStats = await this.getSourceStats();
    this.reportProgress(50, 'Source analysis complete');

    // Get trend analysis
    const trends = await this.getTrends();
    this.reportProgress(70, 'Trend analysis complete');

    // Get anomaly detection
    const anomalies = await this.detectAnomalies();
    this.reportProgress(90, 'Anomaly detection complete');

    const result = {
      categories: categoryStats,
      sources: sourceStats,
      trends,
      anomalies,
      analyzedAt: new Date().toISOString(),
    };

    this.reportProgress(100, 'Analysis complete');
    return result;
  }

  /**
   * Get category statistics
   */
  private async getCategoryStats(): Promise<AnalysisResult[]> {
    const result = await query<{
      category: string;
      count: string;
    }>(`
      SELECT category, COUNT(*) as count
      FROM rss_items
      WHERE pub_date > NOW() - INTERVAL '7 days'
      GROUP BY category
      ORDER BY count DESC
    `);

    return result.rows.map(row => ({
      category: row.category || 'uncategorized',
      count: parseInt(row.count, 10),
      trend: 'stable' as const,
      avgDaily: Math.round(parseInt(row.count, 10) / 7),
      sources: [],
    }));
  }

  /**
   * Get source statistics
   */
  private async getSourceStats(): Promise<Array<{ source: string; count: number }>> {
    const result = await query<{
      source_url: string;
      count: string;
    }>(`
      SELECT source_url, COUNT(*) as count
      FROM rss_items
      WHERE pub_date > NOW() - INTERVAL '7 days'
      GROUP BY source_url
      ORDER BY count DESC
      LIMIT 20
    `);

    return result.rows.map(row => ({
      source: row.source_url,
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Get trend analysis
   */
  private async getTrends(): Promise<Record<string, { current: number; previous: number; change: number }>> {
    const result: Record<string, { current: number; previous: number; change: number }> = {};

    // Get counts for last 7 days vs previous 7 days
    const current = await query<{ category: string; count: string }>(`
      SELECT category, COUNT(*) as count
      FROM rss_items
      WHERE pub_date > NOW() - INTERVAL '7 days'
      GROUP BY category
    `);

    const previous = await query<{ category: string; count: string }>(`
      SELECT category, COUNT(*) as count
      WHERE pub_date BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
      GROUP BY category
    `);

    const prevMap = new Map(previous.rows.map(r => [r.category, parseInt(r.count, 10)]));

    for (const row of current.rows) {
      const currCount = parseInt(row.count, 10);
      const prevCount = prevMap.get(row.category) || 0;
      const change = prevCount > 0 ? ((currCount - prevCount) / prevCount) * 100 : 0;

      result[row.category || 'uncategorized'] = {
        current: currCount,
        previous: prevCount,
        change: Math.round(change),
      };
    }

    return result;
  }

  /**
   * Detect anomalies (unusual spikes in news)
   */
  private async detectAnomalies(): Promise<Array<{ category: string; count: number; expected: number }>> {
    const result = await query<{
      category: string;
      count: string;
      avg_count: string;
    }>(`
      SELECT
        category,
        COUNT(*) as count,
        AVG(daily_count) as avg_count
      FROM (
        SELECT
          category,
          DATE(pub_date) as day,
          COUNT(*) as daily_count
        FROM rss_items
        WHERE pub_date > NOW() - INTERVAL '14 days'
        GROUP BY category, DATE(pub_date)
      ) daily
      GROUP BY category
      HAVING COUNT(*) > AVG(daily_count) * 2
    `);

    return result.rows.map(row => ({
      category: row.category || 'uncategorized',
      count: parseInt(row.count, 10),
      expected: Math.round(parseFloat(row.avg_count)),
    }));
  }
}

export default DataAnalysisAgent;
