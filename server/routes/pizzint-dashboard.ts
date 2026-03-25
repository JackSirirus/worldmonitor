/**
 * PizzINT Dashboard Data API
 * Fetches dashboard data from PizzINT
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://www.pizzint.watch/api/dashboard-data', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'WorldMonitor/1.0' },
    });
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const data = await response.text();
    return res.status(200).set({ 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }).send(data);
  } catch (error: any) {
    return res.status(502).json({ error: 'Failed to fetch PizzINT data', details: error.message });
  }
});

export { router };
