/**
 * CoinGecko API - Cryptocurrency prices
 * Converts Vercel Edge Function to Express route with Redis caching
 */

import express from 'express';
import { getCachedJson, hashString, setCachedJson } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const ALLOWED_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'cny', 'btc', 'eth'];
const MAX_COIN_IDS = 20;
const COIN_ID_PATTERN = /^[a-z0-9-]+$/;

const CACHE_TTL_SECONDS = 120;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const RESPONSE_CACHE_CONTROL = 'public, max-age=120, stale-while-revalidate=60';
const CACHE_VERSION = 'v2';

// In-memory fallback cache
let fallbackCache = { key: '', payload: null, timestamp: 0 };

function validateCoinIds(idsParam) {
  if (!idsParam) return 'bitcoin,ethereum,solana';
  const ids = idsParam.split(',')
    .map(id => id.trim().toLowerCase())
    .filter(id => COIN_ID_PATTERN.test(id) && id.length <= 50)
    .slice(0, MAX_COIN_IDS);
  return ids.length > 0 ? ids.join(',') : 'bitcoin,ethereum,solana';
}

function validateCurrency(val) {
  const currency = (val || 'usd').toLowerCase();
  return ALLOWED_CURRENCIES.includes(currency) ? currency : 'usd';
}

function validateBoolean(val, defaultVal) {
  if (val === 'true' || val === 'false') return val;
  return defaultVal;
}

function isValidPayload(payload) {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    typeof payload.body === 'string' &&
    Number.isFinite(payload.status)
  );
}

router.get('/', async (req, res) => {
  const { ids, vs_currencies, include_24hr_change, endpoint } = req.query;

  const coinIds = validateCoinIds(ids as string);
  const vsCurrency = validateCurrency(vs_currencies as string);
  const include24hrChange = validateBoolean(include_24hr_change as string, 'true');

  const now = Date.now();
  const cacheKey = `${coinIds}:${vsCurrency}:${include24hrChange}`;
  const redisKey = `coingecko:${CACHE_VERSION}:${hashString(cacheKey)}`;

  // Try Redis cache first
  const redisCached = await getCachedJson(redisKey) as any;
  if (isValidPayload(redisCached)) {
    recordCacheTelemetry('/api/coingecko', 'REDIS-HIT');
    return res.status(redisCached.status)
      .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': RESPONSE_CACHE_CONTROL, 'X-Cache': 'REDIS-HIT' })
      .send(redisCached.body);
  }

  // Try memory cache
  if (isValidPayload(fallbackCache.payload) && fallbackCache.key === cacheKey && now - fallbackCache.timestamp < CACHE_TTL_MS) {
    recordCacheTelemetry('/api/coingecko', 'MEMORY-HIT');
    return res.status((fallbackCache.payload as any).status)
      .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': RESPONSE_CACHE_CONTROL, 'X-Cache': 'MEMORY-HIT' })
      .send((fallbackCache.payload as any).body);
  }

  try {
    let geckoUrl;
    if (endpoint === 'markets') {
      geckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&ids=${coinIds}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    } else {
      geckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=${vsCurrency}&include_24hr_change=${include24hrChange}`;
    }

    const response = await fetch(geckoUrl, {
      headers: { 'Accept': 'application/json' },
    });

    // Rate limited? Return cached data
    if (response.status === 429 && isValidPayload(fallbackCache.payload) && fallbackCache.key === cacheKey) {
      recordCacheTelemetry('/api/coingecko', 'STALE');
      return res.status(fallbackCache.payload.status)
        .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': RESPONSE_CACHE_CONTROL, 'X-Cache': 'STALE' })
        .send(fallbackCache.payload.body);
    }

    const data = await response.text();

    // Cache successful responses
    if (response.ok) {
      const payload = { body: data, status: response.status };
      fallbackCache = { key: cacheKey, payload, timestamp: Date.now() };
      setCachedJson(redisKey, payload, CACHE_TTL_SECONDS);
      recordCacheTelemetry('/api/coingecko', 'MISS');
    } else {
      recordCacheTelemetry('/api/coingecko', 'UPSTREAM-ERROR');
    }

    return res.status(response.status)
      .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': RESPONSE_CACHE_CONTROL, 'X-Cache': 'MISS' })
      .send(data);
  } catch (error) {
    // Error? Return cached data if available
    if (isValidPayload(fallbackCache.payload) && fallbackCache.key === cacheKey) {
      recordCacheTelemetry('/api/coingecko', 'ERROR-FALLBACK');
      return res.status(fallbackCache.payload.status)
        .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=120', 'X-Cache': 'ERROR-FALLBACK' })
        .send(fallbackCache.payload.body);
    }
    recordCacheTelemetry('/api/coingecko', 'ERROR');
    return res.status(500).json({ error: 'Failed to fetch CoinGecko data', message: error.message });
  }
});

export { router };
