/**
 * RSS Collector API Routes
 * Provides endpoints for RSS collection management
 */

import express from 'express';
import { fetchRSSSources, syncSourcesToDatabase, RSS_FEEDS } from '../agent/rss-collector.js';

const router = express.Router();

/**
 * POST /api/rss-collector/collect
 * Trigger RSS collection manually
 */
router.post('/collect', async (req, res) => {
  try {
    const sessionId = `manual-${Date.now()}`;
    const result = await fetchRSSSources(sessionId);

    res.json({
      success: true,
      collected: result.collected,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RSS Collector API] Collection failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/rss-collector/sync
 * Sync RSS sources to database
 */
router.post('/sync', async (req, res) => {
  try {
    // Get sources from request body or use default list
    const sources = req.body.sources || [];

    if (sources.length === 0) {
      // Return current sources count
      const { query } = await import('../database/connection.js');
      const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM rss_sources');
      res.json({
        success: true,
        message: 'Use POST with sources array to add new sources',
        currentCount: parseInt(result.rows[0]?.count || '0'),
      });
      return;
    }

    const synced = await syncSourcesToDatabase(sources);

    res.json({
      success: true,
      synced,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RSS Collector API] Sync failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/rss-collector/sync-all
 * Sync all predefined RSS feeds to database
 */
router.post('/sync-all', async (req, res) => {
  try {
    const synced = await syncSourcesToDatabase(RSS_FEEDS);

    res.json({
      success: true,
      synced,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RSS Collector API] Sync all failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/rss-collector/status
 * Get RSS sources status
 */
router.get('/status', async (req, res) => {
  try {
    const { query } = await import('../database/connection.js');

    const sources = await query(`
      SELECT
        id, url, name, category, last_fetch, status, error_message,
        last_checked, response_time
      FROM rss_sources
      ORDER BY name ASC
    `);

    const stats = await query<{ total: string; ok: string; errors: string; pending: string }>(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ok' THEN 1 END) as ok,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM rss_sources
    `);

    res.json({
      success: true,
      sources: sources.rows,
      stats: {
        total: parseInt(stats.rows[0]?.total || '0'),
        ok: parseInt(stats.rows[0]?.ok || '0'),
        errors: parseInt(stats.rows[0]?.errors || '0'),
        pending: parseInt(stats.rows[0]?.pending || '0'),
      },
    });
  } catch (error) {
    console.error('[RSS Collector API] Status failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/rss-collector/items
 * Get recent RSS items
 */
router.get('/items', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const category = req.query.category as string | undefined;

    const { query } = await import('../database/connection.js');

    let sql = `
      SELECT
        i.id, i.title, i.link, i.description, i.pub_date,
        i.fetched_at, i.category, s.name as source_name
      FROM rss_items i
      LEFT JOIN rss_sources s ON i.source_url = s.url
    `;

    const params: any[] = [];
    if (category) {
      sql += ` WHERE i.category = $1`;
      params.push(category);
    }

    sql += ` ORDER BY i.fetched_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const items = await query(sql, params);

    res.json({
      success: true,
      items: items.rows,
      count: items.rows.length,
    });
  } catch (error) {
    console.error('[RSS Collector API] Items failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/rss-collector/refresh-needed
 * Check if RSS refresh is needed (any source hasn't been fetched in 30 minutes)
 */
router.get('/refresh-needed', async (req, res) => {
  try {
    const { query } = await import('../database/connection.js');
    const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Check for sources that need refreshing
    const staleSources = await query(`
      SELECT COUNT(*) as count
      FROM rss_sources
      WHERE last_fetch IS NULL OR last_fetch < $1
    `, [threshold]);

    const staleCount = parseInt(staleSources.rows[0]?.count || '0', 10);
    const needsRefresh = staleCount > 0;

    // Also get the most recent fetch time
    const latestFetch = await query(`
      SELECT MAX(last_fetch) as latest FROM rss_sources WHERE last_fetch IS NOT NULL
    `);

    res.json({
      needsRefresh,
      staleSourceCount: staleCount,
      lastFetchTime: latestFetch.rows[0]?.latest || null,
      thresholdMinutes: 30,
    });
  } catch (error) {
    console.error('[RSS Collector API] Refresh check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
export default router;
