/**
 * Finnhub Stock Quote API
 * Fetches real-time stock quotes from Finnhub
 * Requires FINNHUB_API_KEY environment variable
 */

import express from 'express';

const router = express.Router();

const SYMBOL_PATTERN = /^[A-Za-z0-9.^]+$/;
const MAX_SYMBOLS = 20;
const MAX_SYMBOL_LENGTH = 10;

function validateSymbols(symbolsParam: string | null) {
  if (!symbolsParam) return null;

  const symbols = symbolsParam
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(s => s.length <= MAX_SYMBOL_LENGTH && SYMBOL_PATTERN.test(s))
    .slice(0, MAX_SYMBOLS);

  return symbols.length > 0 ? symbols : null;
}

interface FinnhubQuote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

async function fetchQuote(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    return { symbol, error: `HTTP ${response.status}` };
  }

  const data = await response.json() as FinnhubQuote;

  // Finnhub returns { c, d, dp, h, l, o, pc, t } where:
  // c = current price, d = change, dp = percent change
  // h = high, l = low, o = open, pc = previous close, t = timestamp
  if (data.c === 0 && data.h === 0 && data.l === 0) {
    return { symbol, error: 'No data available' };
  }

  return {
    symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: data.t,
  };
}

router.get('/', async (req, res) => {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'Finnhub API key not configured' });
  }

  const symbols = validateSymbols(req.query.symbols as string);

  if (!symbols) {
    return res.status(400).json({ error: 'Invalid or missing symbols parameter' });
  }

  try {
    // Fetch all quotes in parallel (Finnhub allows 60 req/min on free tier)
    const quotes = await Promise.all(
      symbols.map(symbol => fetchQuote(symbol, apiKey))
    );

    return res.status(200)
      .set({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      })
      .json({ quotes });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export { router };
