/**
 * Web Search API Routes
 */

import express from 'express';
import { webSearch, runSearch } from '../agent/web-search.js';

const router = express.Router();

/**
 * POST /api/web-search
 * Perform a web search
 */
router.post('/', async (req, res) => {
  try {
    const { query, limit, providers, store } = req.body;

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Query is required',
      });
      return;
    }

    const sessionId = `search-${Date.now()}`;
    const result = await runSearch(query, sessionId, {
      limit,
      providers,
      store: store !== false,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[WebSearch API] Search failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/web-search
 * Perform a web search (GET variant)
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const store = req.query.store !== 'false';

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const sessionId = `search-${Date.now()}`;
    const result = await runSearch(query, sessionId, {
      limit,
      store,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[WebSearch API] Search failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
export default router;
