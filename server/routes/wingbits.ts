/**
 * Wingbits API proxy - keeps API key server-side
 * Requires WINGBITS_API_KEY environment variable
 */

import express from 'express';

const router = express.Router();

router.all('*', async (req, res) => {
  const apiKey = process.env.WINGBITS_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'Wingbits not configured', configured: false });

  const path = req.path;

  // GET /details/:icao24 - Aircraft details
  const detailsMatch = path.match(/^\/details\/([a-fA-F0-9]+)$/);
  if (detailsMatch && req.method === 'GET') {
    const icao24 = detailsMatch[1].toLowerCase();
    try {
      const response = await fetch(`https://customer-api.wingbits.com/v1/flights/details/${icao24}`, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
      });
      if (!response.ok) return res.status(response.status).json({ error: `Wingbits API error: ${response.status}`, icao24 });
      const data = await response.json();
      return res.set({ 'Cache-Control': 'public, max-age=86400' }).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: `Fetch failed: ${error.message}`, icao24 });
    }
  }

  // POST /details/batch - Batch lookup
  if (path === '/details/batch' && req.method === 'POST') {
    const icao24List = req.body?.icao24s || [];
    if (!Array.isArray(icao24List) || icao24List.length === 0) return res.status(400).json({ error: 'icao24s array required' });
    const limitedList = icao24List.slice(0, 20).map((id: string) => id.toLowerCase());
    const results: Record<string, any> = {};
    const fetchResults = await Promise.all(limitedList.map(async (icao24) => {
      try {
        const response = await fetch(`https://customer-api.wingbits.com/v1/flights/details/${icao24}`, {
          headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
        });
        if (response.ok) return { icao24, data: await response.json() };
      } catch {}
      return null;
    }));
    for (const result of fetchResults) if (result) results[result.icao24] = result.data;
    return res.json({ results, fetched: Object.keys(results).length, requested: limitedList.length });
  }

  // GET /flights - Live flight positions
  if (path === '/flights' && req.method === 'GET') {
    const la = req.query.la || req.query.lat;
    const lo = req.query.lo || req.query.lon;
    if (!la || !lo) return res.status(400).json({ error: 'lat (la) and lon (lo) required' });
    const w = req.query.w || req.query.width || '500';
    const h = req.query.h || req.query.height || '500';
    const unit = req.query.unit || 'nm';
    try {
      const response = await fetch(`https://customer-api.wingbits.com/v1/flights?by=box&la=${la}&lo=${lo}&w=${w}&h=${h}&unit=${unit}`, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
      });
      if (!response.ok) return res.status(response.status).json({ error: `Wingbits API error: ${response.status}` });
      const data = await response.json();
      return res.set({ 'Cache-Control': 'public, max-age=30' }).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: `Fetch failed: ${error.message}` });
    }
  }

  // POST /flights/batch - Multiple areas
  if (path === '/flights/batch' && req.method === 'POST') {
    const areas = req.body?.areas || [];
    if (!Array.isArray(areas) || areas.length === 0) return res.status(400).json({ error: 'areas array required' });
    const wingbitsAreas = areas.map((area: any) => ({
      alias: area.id || area.alias, by: 'box', la: (area.north + area.south) / 2, lo: (area.east + area.west) / 2,
      w: Math.abs(area.east - area.west) * 60, h: Math.abs(area.north - area.south) * 60, unit: 'nm',
    }));
    try {
      const response = await fetch('https://customer-api.wingbits.com/v1/flights', {
        method: 'POST', headers: { 'x-api-key': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(wingbitsAreas),
      });
      if (!response.ok) return res.status(response.status).json({ error: `Wingbits API error: ${response.status}` });
      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: `Fetch failed: ${error.message}` });
    }
  }

  // GET /health
  if (path === '/' || path === '/health') {
    try {
      const response = await fetch('https://customer-api.wingbits.com/health', { headers: { 'x-api-key': apiKey } });
      const data = await response.json() as any;
      return res.json({ ...data, configured: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, configured: true });
    }
  }

  return res.status(404).json({ error: 'Not found' });
});

export { router };
