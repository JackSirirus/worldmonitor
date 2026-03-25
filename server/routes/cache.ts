/**
 * Cache API Routes
 * GET /api/cache/news - Get cached news items
 * GET /api/cache/sources - Get RSS sources status
 */

import { Router } from 'express';
import * as rssCache from '../services/rss-cache.js';

const router = Router();

/**
 * GET /api/cache/news
 * Query params:
 *   - category: string (optional) - filter by category
 *   - forceRefresh: boolean (optional) - force refresh from source
 *   - limit: number (optional) - limit results
 */
router.get('/news', async (req, res) => {
  try {
    const { category, forceRefresh, limit } = req.query;

    const force = forceRefresh === 'true';
    const maxLimit = Math.min(parseInt(limit as string) || 100, 500);

    let items;

    if (category) {
      items = await rssCache.getItemsByCategory(category as string, maxLimit);
    } else {
      items = await rssCache.getRecentItems(maxLimit);
    }

    res.json({
      items,
      count: items.length,
      category: category || 'all',
      cached: true,
    });
  } catch (error) {
    console.error('[Cache API] Error fetching news:', error);
    res.status(500).json({
      error: 'Failed to fetch cached news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/cache/sources
 * Get all RSS sources with their status
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = await rssCache.getSources();

    res.json({
      sources,
      total: sources.length,
      ok: sources.filter(s => s.status === 'ok').length,
      error: sources.filter(s => s.status === 'error').length,
      warning: sources.filter(s => s.status === 'warning').length,
    });
  } catch (error) {
    console.error('[Cache API] Error fetching sources:', error);
    res.status(500).json({
      error: 'Failed to fetch sources',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await rssCache.getCacheStats();

    res.json(stats);
  } catch (error) {
    console.error('[Cache API] Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch cache stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
