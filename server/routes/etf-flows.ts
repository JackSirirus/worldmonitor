/**
 * ETF Flows API - Bitcoin ETF flow estimation
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

const CACHE_TTL = 900;
let cachedResponse = null;
let cacheTimestamp = 0;

const ETF_LIST = [
  { ticker: 'IBIT', issuer: 'BlackRock' },
  { ticker: 'FBTC', issuer: 'Fidelity' },
  { ticker: 'ARKB', issuer: 'ARK/21Shares' },
  { ticker: 'BITB', issuer: 'Bitwise' },
  { ticker: 'GBTC', issuer: 'Grayscale' },
  { ticker: 'HODL', issuer: 'VanEck' },
  { ticker: 'BRRR', issuer: 'Valkyrie' },
  { ticker: 'EZBC', issuer: 'Franklin' },
  { ticker: 'BTCO', issuer: 'Invesco' },
  { ticker: 'BTCW', issuer: 'WisdomTree' },
];

async function fetchChart(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function parseChartData(chart, ticker, issuer) {
  try {
    const result = chart?.chart?.result?.[0];
    if (!result) return null;

    const quote = result.indicators?.quote?.[0];
    const closes = quote?.close || [];
    const volumes = quote?.volume || [];

    const validCloses = closes.filter(p => p != null);
    const validVolumes = volumes.filter(v => v != null);

    if (validCloses.length < 2) return null;

    const latestPrice = validCloses[validCloses.length - 1];
    const prevPrice = validCloses[validCloses.length - 2];
    const priceChange = prevPrice ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;

    const latestVolume = validVolumes.length > 0 ? validVolumes[validVolumes.length - 1] : 0;
    const avgVolume = validVolumes.length > 1
      ? validVolumes.slice(0, -1).reduce((a, b) => a + b, 0) / (validVolumes.length - 1)
      : latestVolume;

    // Estimate flow direction from price change + volume
    const highVolume = latestVolume > avgVolume * 1.5;
    let flow = 'unknown';
    if (priceChange > 0.5 && highVolume) flow = 'inflow';
    else if (priceChange < -0.5 && highVolume) flow = 'outflow';
    else if (priceChange > 0) flow = 'inflow';
    else if (priceChange < 0) flow = 'outflow';

    return { ticker, issuer, price: latestPrice, change: priceChange, volume: latestVolume, flow, estFlow: latestVolume };
  } catch {
    return null;
  }
}

router.get('/', async (req, res) => {
  const now = Date.now();

  // Return cached response if valid
  if (cachedResponse && now - cacheTimestamp < CACHE_TTL * 1000) {
    return res.set({ 'Cache-Control': 'public, max-age=900' }).json(cachedResponse);
  }

  try {
    const charts = await Promise.all(ETF_LIST.map(etf => fetchChart(etf.ticker)));

    const etfs = charts.map((chart, i) => {
      const etf = ETF_LIST[i];
      return parseChartData(chart, etf.ticker, etf.issuer);
    }).filter(Boolean);

    // Calculate summary
    const totalVolume = etfs.reduce((sum, e) => sum + (e.volume || 0), 0);
    const totalEstFlow = etfs.reduce((sum, e) => sum + (e.estFlow || 0), 0);
    const inflowCount = etfs.filter(e => e.flow === 'inflow').length;
    const outflowCount = etfs.filter(e => e.flow === 'outflow').length;
    const netDirection = totalEstFlow > 0 ? 'INFLOW' : totalEstFlow < 0 ? 'OUTFLOW' : 'NEUTRAL';

    const summary = {
      etfCount: etfs.length,
      totalVolume,
      totalEstFlow,
      netDirection,
      inflowCount,
      outflowCount,
    };

    cachedResponse = { etfs, timestamp: now, summary };
    cacheTimestamp = now;

    res.set({ 'Cache-Control': 'public, max-age=900' }).json(cachedResponse);
  } catch (error) {
    console.error('[ETFFlows] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch ETF data', message: error.message });
  }
});

export { router };
