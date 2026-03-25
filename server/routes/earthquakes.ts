/**
 * Earthquakes API - USGS earthquake data
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

const USGS_EARTHQUAKE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';

router.get('/', async (req, res) => {
  try {
    const response = await fetch(USGS_EARTHQUAKE_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.text();

    res.status(response.status)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      })
      .send(data);
  } catch (error) {
    console.error('[Earthquakes] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export { router };
