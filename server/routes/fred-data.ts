/**
 * FRED (Federal Reserve Economic Data) API
 * Fetches economic data from FRED
 * Requires FRED_API_KEY environment variable
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const seriesId = req.query.series_id as string;
  const observationStart = req.query.observation_start as string;
  const observationEnd = req.query.observation_end as string;

  if (!seriesId) {
    return res.status(400).json({ error: 'Missing series_id parameter' });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'FRED_API_KEY not configured' });
  }

  try {
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit: '10',
    });

    if (observationStart) params.set('observation_start', observationStart);
    if (observationEnd) params.set('observation_end', observationEnd);

    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params}`;
    const response = await fetch(fredUrl, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();

    return res.status(response.status)
      .set({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      })
      .json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export { router };
