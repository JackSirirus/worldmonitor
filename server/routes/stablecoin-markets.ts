/**
 * Stablecoin Markets API
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

const CACHE_TTL = 120;
let cachedResponse = null;
let cacheTimestamp = 0;

const DEFAULT_COINS = 'tether,usd-coin,dai,first-digital-usd,ethena-usde';

router.get('/', async (req, res) => {
  const now = Date.now();

  if (cachedResponse && now - cacheTimestamp < CACHE_TTL * 1000) {
    return res.set({ 'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=300` }).json(cachedResponse);
  }

  const rawCoins = (req.query.coins as string) || DEFAULT_COINS;
  const coins = rawCoins.split(',').filter(c => /^[a-z0-9-]+$/.test(c)).join(',') || DEFAULT_COINS;

  try {
    const controller = new AbortController();
    // Increase timeout to 30 seconds for slow connections
    const id = setTimeout(() => controller.abort(), 30000);

    const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coins}&order=market_cap_desc&sparkline=false&price_change_percentage=7d`;
    const response = await fetch(apiUrl, { signal: controller.signal });

    clearTimeout(id);

    const data = await response.json() as any;

    // Calculate deviation from $1 peg
    const stablecoins = data.map((coin: any) => {
      const price = coin.current_price;
      const deviation = Math.abs(1 - price);
      const health = deviation < 0.01 ? 'healthy' : deviation < 0.05 ? 'warning' : 'critical';

      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price,
        deviation: Number((deviation * 100).toFixed(2)),
        change7d: Number(coin.price_change_percentage_7d?.toFixed(2) || 0),
        market_cap: coin.market_cap,
        health,
      };
    });

    cachedResponse = { stablecoins, timestamp: now };
    cacheTimestamp = now;

    res.set({ 'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=300` }).json(cachedResponse);
  } catch (error: any) {
    // Reduce log noise: only log non-abort errors or first abort error
    const isAbort = error.name === 'AbortError' || error.message === 'This operation was aborted.';
    if (!isAbort || !cachedResponse) {
      console.error('[Stablecoin] Error:', error.message);
    }
    // If we have cached data, return it instead of error
    if (cachedResponse) {
      return res.set({ 'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=3600` }).json(cachedResponse);
    }
    res.status(500).json({ error: 'Failed to fetch stablecoin data', message: error.message });
  }
});

export { router };
