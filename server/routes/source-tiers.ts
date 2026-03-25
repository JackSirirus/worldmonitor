/**
 * Source Tiers API
 * Provides endpoint to get RSS source tier information
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/source-tiers
 * Get all RSS sources with their tier levels
 */
router.get('/', async (req, res) => {
  try {
    const { query } = await import('../database/connection.js');

    const result = await query(`
      SELECT url, name, category, tier
      FROM rss_sources
      WHERE tier IS NOT NULL
      ORDER BY tier ASC, name ASC
    `);

    res.json({
      success: true,
      sources: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[Source Tiers API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
export default router;
