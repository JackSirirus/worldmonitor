/**
 * ACLED Conflict Events API proxy - battles, explosions, violence against civilians
 * Separate from protest proxy to avoid mixing data flows
 * Redis cached (10min TTL)
 */

import express from 'express';
import { getCachedJson, setCachedJson } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';
import { rateLimitMiddleware } from '../utils/rate-limit.js';

const router = express.Router();

const CACHE_KEY = 'acled:conflict:v2';
const CACHE_TTL_SECONDS = 10 * 60;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

let fallbackCache = { data: null, timestamp: 0 };

function toErrorMessage(error: any) {
  if (error instanceof Error) return error.message;
  return String(error || 'unknown error');
}

router.get('/', async (req, res) => {
  // Apply rate limiting
  rateLimitMiddleware(req, res, () => {});

  if (res.headersSent) return;

  const now = Date.now();

  // Try Redis cache first
  const cached = await getCachedJson(CACHE_KEY);
  if (cached && typeof cached === 'object' && Array.isArray((cached as any).data)) {
    recordCacheTelemetry('/api/acled-conflict', 'REDIS-HIT');
    return res.status(200)
      .set({ 'Cache-Control': 'public, max-age=300', 'X-Cache': 'REDIS-HIT' })
      .json(cached);
  }

  // Try memory cache
  if (fallbackCache.data && now - fallbackCache.timestamp < CACHE_TTL_MS) {
    recordCacheTelemetry('/api/acled-conflict', 'MEMORY-HIT');
    return res.status(200)
      .set({ 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MEMORY-HIT' })
      .json(fallbackCache.data);
  }

  const token = process.env.ACLED_ACCESS_TOKEN;
  if (!token) {
    return res.status(200).json({ error: 'ACLED not configured', data: [], configured: false });
  }

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = new URLSearchParams({
      event_type: 'Battles|Explosions/Remote violence|Violence against civilians',
      event_date: `${startDate}|${endDate}`,
      event_date_where: 'BETWEEN',
      limit: '500',
      _format: 'json',
    });

    const response = await fetch(`https://acleddata.com/api/acled/read?${params}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `ACLED API error: ${response.status}`, details: text.substring(0, 200), data: [] });
    }

    const rawData = await response.json() as any;
    const events = Array.isArray(rawData?.data) ? rawData.data : [];
    const sanitizedEvents = events.map((e: any) => ({
      event_id_cnty: e.event_id_cnty,
      event_date: e.event_date,
      event_type: e.event_type,
      sub_event_type: e.sub_event_type,
      actor1: e.actor1,
      actor2: e.actor2,
      country: e.country,
      admin1: e.admin1,
      location: e.location,
      latitude: e.latitude,
      longitude: e.longitude,
      fatalities: e.fatalities,
      notes: typeof e.notes === 'string' ? e.notes.substring(0, 500) : undefined,
      source: e.source,
      tags: e.tags,
    }));

    const result = {
      success: true,
      count: sanitizedEvents.length,
      data: sanitizedEvents,
      cached_at: new Date().toISOString(),
    };

    fallbackCache = { data: result as any, timestamp: now };
    await setCachedJson(CACHE_KEY, result, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/acled-conflict', 'MISS');

    return res.status(200)
      .set({ 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS' })
      .json(result);
  } catch (error) {
    if (fallbackCache.data) {
      recordCacheTelemetry('/api/acled-conflict', 'STALE');
      return res.status(200)
        .set({ 'Cache-Control': 'public, max-age=60', 'X-Cache': 'STALE' })
        .json(fallbackCache.data);
    }

    recordCacheTelemetry('/api/acled-conflict', 'ERROR');
    return res.status(500).json({ error: `Fetch failed: ${toErrorMessage(error)}`, data: [] });
  }
});

export { router };
