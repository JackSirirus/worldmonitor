/**
 * Wingbits batch aircraft details
 */

import express from 'express';

const router = express.Router();

router.post('/batch', async (req, res) => {
  const apiKey = process.env.WINGBITS_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'Wingbits not configured', configured: false });
  }

  try {
    const { icao24s = [] } = req.body;

    if (!Array.isArray(icao24s) || icao24s.length === 0) {
      return res.status(400).json({ error: 'icao24s array required' });
    }

    // Limit batch size
    const limitedList = icao24s.slice(0, 20).map((id: string) => id.toLowerCase());
    const results: Record<string, any> = {};

    // Fetch all in parallel
    const fetchPromises = limitedList.map(async (icao24: string) => {
      try {
        const response = await fetch(`https://customer-api.wingbits.com/v1/flights/details/${icao24}`, {
          headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          return { icao24, data: await response.json() };
        }
      } catch {
        // Skip failed lookups
      }
      return null;
    });

    const fetchResults = await Promise.all(fetchPromises);
    for (const result of fetchResults) {
      if (result) results[result.icao24] = result.data;
    }

    return res.json({
      results,
      fetched: Object.keys(results).length,
      requested: limitedList.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { router };
