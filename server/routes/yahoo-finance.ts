/**
 * Yahoo Finance API
 * Fetches stock chart data from Yahoo Finance
 */

import express from 'express';

const router = express.Router();

const SYMBOL_PATTERN = /^[A-Za-z0-9.^=\-]+$/;
const MAX_SYMBOL_LENGTH = 20;

function validateSymbol(symbol: string | null) {
  if (!symbol) return null;
  const trimmed = symbol.trim().toUpperCase();
  if (trimmed.length > MAX_SYMBOL_LENGTH) return null;
  if (!SYMBOL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

router.get('/', async (req, res) => {
  const symbol = validateSymbol(req.query.symbol as string);

  if (!symbol) {
    return res.status(400).json({ error: 'Invalid or missing symbol parameter' });
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.text();
    return res.status(response.status)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      })
      .send(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export { router };
