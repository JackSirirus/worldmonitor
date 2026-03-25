/**
 * AIS Snapshot API
 * Fetches AIS (Automatic Identification System) vessel data snapshot
 * Redis cached (8s TTL) with memory fallback
 * Requires WS_RELAY_URL and UPSTASH_REDIS environment variables
 */

import express from 'express';
import { getCachedJson, setCachedJson } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const CACHE_TTL_SECONDS = 8;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const CACHE_VERSION = 'v1';
const MEMORY_CACHE_MAX_ENTRIES = 8;
const MEMORY_FALLBACK_MAX_AGE_MS = 60 * 1000;

const memoryCache = new Map();
const inFlightByKey = new Map();

function getErrorMessage(error: any) {
  if (error instanceof Error) return error.message;
  return String(error || 'Failed to fetch AIS snapshot');
}

function getMemoryCachedSnapshot(cacheKey: string, allowStale = false) {
  const entry = memoryCache.get(cacheKey);
  if (!entry) return null;

  const now = Date.now();
  const age = now - entry.timestamp;
  if (allowStale) {
    if (age > MEMORY_FALLBACK_MAX_AGE_MS) {
      memoryCache.delete(cacheKey);
      return null;
    }
  } else if (age > CACHE_TTL_MS) {
    memoryCache.delete(cacheKey);
    return null;
  }

  entry.lastSeen = now;
  return entry.data;
}

function setMemoryCachedSnapshot(cacheKey: string, data: any) {
  const now = Date.now();
  memoryCache.set(cacheKey, { data, timestamp: now, lastSeen: now });

  if (memoryCache.size <= MEMORY_CACHE_MAX_ENTRIES) return;

  const overflow = memoryCache.size - MEMORY_CACHE_MAX_ENTRIES;
  const oldestEntries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen);
  for (let i = 0; i < overflow; i++) {
    const entry = oldestEntries[i];
    if (!entry) break;
    memoryCache.delete(entry[0]);
  }
}

function getRelayBaseUrl() {
  const relayUrl = process.env.WS_RELAY_URL;
  if (!relayUrl) return null;
  return relayUrl
    .replace('wss://', 'https://')
    .replace('ws://', 'http://')
    .replace(/\/$/, '');
}

function isValidSnapshot(data: any) {
  return Boolean(
    data &&
    typeof data === 'object' &&
    data.status &&
    typeof data.status === 'object' &&
    Array.isArray(data.disruptions) &&
    Array.isArray(data.density)
  );
}

router.get('/', async (req, res) => {
  const includeCandidates = req.query.candidates === 'true';
  const cacheKey = `ais-snapshot:${CACHE_VERSION}:${includeCandidates ? 'full' : 'lite'}`;

  // Try Redis cache
  const redisCached = await getCachedJson(cacheKey);
  if (isValidSnapshot(redisCached)) {
    setMemoryCachedSnapshot(cacheKey, redisCached);
    recordCacheTelemetry('/api/ais-snapshot', 'REDIS-HIT');
    return res.status(200)
      .set({ 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`, 'X-Cache': 'REDIS-HIT' })
      .json(redisCached);
  }

  // Try memory cache
  const memoryCached = getMemoryCachedSnapshot(cacheKey);
  if (isValidSnapshot(memoryCached)) {
    recordCacheTelemetry('/api/ais-snapshot', 'MEMORY-HIT');
    return res.status(200)
      .set({ 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`, 'X-Cache': 'MEMORY-HIT' })
      .json(memoryCached);
  }

  const relayBaseUrl = getRelayBaseUrl();
  if (!relayBaseUrl) {
    recordCacheTelemetry('/api/ais-snapshot', 'NO-RELAY-CONFIG');
    return res.status(503).json({ error: 'AIS relay not configured' });
  }

  try {
    let requestPromise = inFlightByKey.get(cacheKey);
    if (!requestPromise) {
      requestPromise = (async () => {
        const upstreamUrl = `${relayBaseUrl}/ais/snapshot?candidates=${includeCandidates ? 'true' : 'false'}`;
        const response = await fetch(upstreamUrl, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`AIS relay HTTP ${response.status}`);
        const data = await response.json();
        if (!isValidSnapshot(data)) throw new Error('Invalid AIS snapshot payload');
        return data;
      })();
      inFlightByKey.set(cacheKey, requestPromise);
    }

    const data = await requestPromise;
    if (!isValidSnapshot(data)) throw new Error('Invalid AIS snapshot payload');

    setMemoryCachedSnapshot(cacheKey, data);
    await setCachedJson(cacheKey, data, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/ais-snapshot', 'MISS');

    return res.status(200)
      .set({ 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`, 'X-Cache': 'MISS' })
      .json(data);
  } catch (error) {
    const staleMemory = getMemoryCachedSnapshot(cacheKey, true);
    if (isValidSnapshot(staleMemory)) {
      recordCacheTelemetry('/api/ais-snapshot', 'MEMORY-ERROR-FALLBACK');
      return res.status(200)
        .set({ 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`, 'X-Cache': 'MEMORY-ERROR-FALLBACK' })
        .json(staleMemory);
    }

    recordCacheTelemetry('/api/ais-snapshot', 'ERROR');
    return res.status(502).json({ error: getErrorMessage(error) });
  } finally {
    inFlightByKey.delete(cacheKey);
  }
});

export { router };
