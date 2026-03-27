/**
 * EIA (Energy Information Administration) API proxy
 * Keeps API key server-side
 * Requires EIA_API_KEY environment variable
 */

import express from 'express';

const router = express.Router();

function getCorsOrigin(req: express.Request): string {
  const origin = req.headers.origin || '';
  if (
    origin.endsWith('.worldmonitor.app') ||
    origin === 'https://worldmonitor.app' ||
    origin.startsWith('http://localhost:')
  ) {
    return origin;
  }
  return 'https://worldmonitor.app';
}

// Handler for /api/eia/* routes
// Use /* to match all paths including /health and /petroleum
router.all('/*', async (req, res) => {
  const corsOrigin = getCorsOrigin(req);
  const path = req.path;

  // Only allow GET and OPTIONS methods
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204)
      .set({
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      .send();
  }

  const apiKey = process.env.EIA_API_KEY;

  // Health check - path could be '/' or '/health' (req.path is relative to mount point)
  if (path === '/' || path === '/health') {
    return res.set({ 'Access-Control-Allow-Origin': corsOrigin }).json({ configured: !!apiKey });
  }

  // Petroleum data endpoint
  if (path === '/petroleum') {
    try {
      const series: Record<string, string> = {
        wti: 'PET.RWTC.W',
        brent: 'PET.RBRTE.W',
        production: 'PET.WCRFPUS2.W',
        inventory: 'PET.WCESTUS1.W',
      };

      const results: Record<string, any> = {};

      // Fetch all series in parallel
      const fetchPromises = Object.entries(series).map(async ([key, seriesId]) => {
        try {
          const response = await fetch(
            `https://api.eia.gov/v2/seriesid/${seriesId}?api_key=${apiKey}&num=2`,
            { headers: { 'Accept': 'application/json' } }
          );

          if (!response.ok) return null;

          const data = await response.json() as any;
          const values = data?.response?.data || [];

          if (values.length >= 1) {
            return {
              key,
              data: {
                current: values[0]?.value,
                previous: values[1]?.value || values[0]?.value,
                date: values[0]?.period,
                unit: values[0]?.unit,
              }
            };
          }
        } catch (e: any) {
          console.error(`[EIA] Failed to fetch ${key}:`, e.message);
        }
        return null;
      });

      const fetchResults = await Promise.all(fetchPromises);

      for (const result of fetchResults) {
        if (result) {
          results[result.key] = result.data;
        }
      }

      return res.set({
        'Access-Control-Allow-Origin': corsOrigin,
        'Cache-Control': 'public, max-age=1800',
      }).json(results);
    } catch (error: any) {
      console.error('[EIA] Fetch error:', error);
      return res.status(500).set({ 'Access-Control-Allow-Origin': corsOrigin }).json({
        error: 'Failed to fetch EIA data',
      });
    }
  }

  return res.status(404).set({ 'Access-Control-Allow-Origin': corsOrigin }).json({ error: 'Not found' });
});

export { router };
