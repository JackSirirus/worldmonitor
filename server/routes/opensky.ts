/**
 * OpenSky Network API proxy
 * Note: OpenSky seems to block some cloud provider IPs
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  // Build OpenSky API URL with bounding box params
  const params = new URLSearchParams();
  (['lamin', 'lomin', 'lamax', 'lomax'] as const).forEach(key => {
    const val = req.query[key];
    if (val) params.set(key, String(val));
  });

  const openskyUrl = `https://opensky-network.org/api/states/all${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const response = await fetch(openskyUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });

    if (response.status === 429) {
      return res.status(429).json({ error: 'Rate limited', time: Date.now(), states: null });
    }

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `OpenSky HTTP ${response.status}: ${text.substring(0, 200)}`,
        time: Date.now(),
        states: null
      });
    }

    const data = await response.json();
    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      })
      .json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: `Fetch failed: ${error.name} - ${error.message}`,
      time: Date.now(),
      states: null
    });
  }
});

export { router };
