/**
 * News Clusters API
 * Provides endpoints for news clustering
 */

import express from 'express';
import { getClusters, clusterRecentNews } from '../services/news-clustering.js';

const router = express.Router();

/**
 * GET /api/news/clusters
 * Get news clusters
 */
router.get('/', async (req, res) => {
  try {
    const minItems = parseInt(req.query.minItems as string) || 2;
    const clusters = await getClusters(minItems);

    res.json({
      success: true,
      clusters,
      count: clusters.length,
    });
  } catch (error) {
    console.error('[News Clusters API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/news/clusters/refresh
 * Trigger clustering refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    await clusterRecentNews(limit);

    res.json({
      success: true,
      message: 'Clustering refreshed',
    });
  } catch (error) {
    console.error('[News Clusters API] Refresh error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
export default router;
