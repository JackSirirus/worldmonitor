/**
 * ArXiv API - AI/ML papers
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

router.get('/', async (req, res) => {
  try {
    const { category, max_results, sortBy } = req.query;

    const cat = category || 'cs.AI';
    const max = max_results || '50';
    const sort = sortBy || 'submittedDate';

    const query = `cat:${cat}`;
    const apiUrl = `${ARXIV_API_URL}?search_query=${encodeURIComponent(query)}&start=0&max_results=${max}&sortBy=${sort}&sortOrder=descending`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WorldMonitor/1.0 (AI Research Tracker)',
      },
    });

    if (!response.ok) {
      throw new Error(`ArXiv API returned ${response.status}`);
    }

    const xmlData = await response.text();

    res.status(200)
      .set({
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      })
      .send(xmlData);
  } catch (error) {
    console.error('[ArXiv] Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch ArXiv data',
      message: error.message
    });
  }
});

export { router };
