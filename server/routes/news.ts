/**
 * News API Router
 * GET /api/news - List news with pagination
 * GET /api/news/:id - Get news by ID
 * GET /api/news/search - Search news
 */

import { Router } from 'express';
import { getNews, getNewsById, getCategories, getSources, getNewsCount } from '../repositories/news.js';

const router = Router();

/**
 * GET /api/news
 * List news with pagination and filters
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const filters = {
      sourceUrl: req.query.source as string | undefined,
      category: req.query.category as string | undefined,
      fromDate: req.query.from ? new Date(req.query.from as string) : undefined,
      toDate: req.query.to ? new Date(req.query.to as string) : undefined,
      search: req.query.search as string | undefined,
    };

    const result = await getNews(filters, { page, limit });

    res.json({
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('[News API] Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

/**
 * GET /api/news/categories
 * Get list of available categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('[News API] Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/news/sources
 * Get list of available sources
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = await getSources();
    res.json({ sources });
  } catch (error) {
    console.error('[News API] Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

/**
 * GET /api/news/stats
 * Get news statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const total = await getNewsCount();
    const categories = await getCategories();
    const sources = await getSources();

    res.json({
      total,
      categories: categories.length,
      sources: sources.length,
    });
  } catch (error) {
    console.error('[News API] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/news/search
 * Search news (alias for GET /api/news?search=...)
 */
router.get('/search', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const filters = {
      search: req.query.q as string || req.query.search as string,
      category: req.query.category as string | undefined,
      sourceUrl: req.query.source as string | undefined,
    };

    if (!filters.search) {
      return res.status(400).json({ error: 'Search query is required (q or search parameter)' });
    }

    const result = await getNews(filters, { page, limit });

    res.json({
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
      query: filters.search,
    });
  } catch (error) {
    console.error('[News API] Error searching news:', error);
    res.status(500).json({ error: 'Failed to search news' });
  }
});

/**
 * GET /api/news/:id
 * Get news item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    const news = await getNewsById(id);

    if (!news) {
      return res.status(404).json({ error: 'News item not found' });
    }

    res.json(news);
  } catch (error) {
    console.error('[News API] Error fetching news by id:', error);
    res.status(500).json({ error: 'Failed to fetch news item' });
  }
});

export { router };
export default router;
