/**
 * PizzINT GDELT Batch API
 * Fetches GDELT data from PizzINT
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const pairs = req.query.pairs as string || 'usa_russia,russia_ukraine,usa_china,china_taiwan,usa_iran,usa_venezuela';
  const dateStart = req.query.dateStart as string;
  const dateEnd = req.query.dateEnd as string;
  const method = req.query.method as string || 'gpr';

  let targetUrl = `https://www.pizzint.watch/api/gdelt/batch?pairs=${encodeURIComponent(pairs)}&method=${method}`;
  if (dateStart) targetUrl += `&dateStart=${dateStart}`;
  if (dateEnd) targetUrl += `&dateEnd=${dateEnd}`;

  try {
    const response = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'WorldMonitor/1.0' },
    });
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const data = await response.text();
    return res.status(200).set({ 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }).send(data);
  } catch (error: any) {
    return res.status(502).json({ error: 'Failed to fetch GDELT data', details: error.message });
  }
});

export { router };
