/**
 * Polymarket API
 * Fetches prediction market data from Polymarket
 */

import express from 'express';

const router = express.Router();

const ALLOWED_ORDER = ['volume', 'liquidity', 'startDate', 'endDate', 'spread'];
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

function validateBoolean(val: string | undefined, defaultVal: string) {
  if (val === 'true' || val === 'false') return val;
  return defaultVal;
}

function validateLimit(val: string | undefined) {
  const num = parseInt(val || '', 10);
  if (isNaN(num)) return 50;
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, num));
}

function validateOrder(val: string | undefined) {
  return ALLOWED_ORDER.includes(val || '') ? (val || 'volume') : 'volume';
}

function sanitizeTagSlug(val: string | undefined) {
  if (!val) return null;
  return val.replace(/[^a-z0-9-]/gi, '').slice(0, 100) || null;
}

router.get('/', async (req, res) => {
  const endpoint = (req.query.endpoint as string) || 'markets';
  const closed = validateBoolean(req.query.closed as string | undefined, 'false');
  const order = validateOrder(req.query.order as string | undefined);
  const ascending = validateBoolean(req.query.ascending as string | undefined, 'false');
  const limit = validateLimit(req.query.limit as string | undefined);

  try {
    let polyUrl;

    if (endpoint === 'events') {
      const tag = sanitizeTagSlug(req.query.tag as string | undefined);
      const params = new URLSearchParams({
        closed,
        order,
        ascending,
        limit: String(limit),
      });
      if (tag) params.set('tag_slug', tag);
      polyUrl = `https://gamma-api.polymarket.com/events?${params}`;
    } else {
      polyUrl = `https://gamma-api.polymarket.com/markets?closed=${closed}&order=${order}&ascending=${ascending}&limit=${limit}`;
    }

    const response = await fetch(polyUrl, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.text();
    return res.status(response.status)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120',
      })
      .send(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export { router };
