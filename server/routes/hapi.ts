/**
 * HDX HAPI (Humanitarian API) proxy
 * Returns aggregated conflict event counts per country
 * Source: ACLED data aggregated monthly by HDX
 * Redis cached (6h TTL)
 */

import express from 'express';
import { getCachedJson, setCachedJson } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const CACHE_KEY = 'hapi:conflict-events:v2';
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const RESPONSE_CACHE_CONTROL = 'public, max-age=1800';

// In-memory fallback when Redis is unavailable.
let fallbackCache = { data: null, timestamp: 0 };

function isValidResult(data) {
  return Boolean(
    data &&
    typeof data === 'object' &&
    Array.isArray(data.countries)
  );
}

function toErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error || 'unknown error');
}

router.get('/', async (req, res) => {
  const now = Date.now();

  // Try Redis cache first
  const cached = await getCachedJson(CACHE_KEY);
  if (isValidResult(cached)) {
    recordCacheTelemetry('/api/hapi', 'REDIS-HIT');
    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': RESPONSE_CACHE_CONTROL,
        'X-Cache': 'REDIS-HIT',
      })
      .json(cached);
  }

  // Try memory cache
  if (isValidResult(fallbackCache.data) && now - fallbackCache.timestamp < CACHE_TTL_MS) {
    recordCacheTelemetry('/api/hapi', 'MEMORY-HIT');
    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': RESPONSE_CACHE_CONTROL,
        'X-Cache': 'MEMORY-HIT',
      })
      .json(fallbackCache.data);
  }

  try {
    const appId = btoa('worldmonitor:monitor@worldmonitor.app');
    const response = await fetch(
      `https://hapi.humdata.org/api/v2/coordination-context/conflict-events?output_format=json&limit=1000&offset=0&app_identifier=${appId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HAPI API error: ${response.status}`);
    }

    const rawData = await response.json() as any;
    const records = rawData.data || [];

    // Each record is (country, event_type, month) — aggregate across event types per country
    // Keep only the most recent month per country
    const byCountry = {};
    for (const r of records) {
      const iso3 = r.location_code || '';
      if (!iso3) continue;

      const month = r.reference_period_start || '';
      const eventType = (r.event_type || '').toLowerCase();
      const events = r.events || 0;
      const fatalities = r.fatalities || 0;

      if (!byCountry[iso3]) {
        byCountry[iso3] = {
          iso3,
          locationName: r.location_name || '',
          month,
          eventsTotal: 0,
          eventsPoliticalViolence: 0,
          eventsCivilianTargeting: 0,
          eventsDemonstrations: 0,
          fatalitiesTotalPoliticalViolence: 0,
          fatalitiesTotalCivilianTargeting: 0
        };
      }

      const c = byCountry[iso3];
      if (month > c.month) {
        // Newer month — reset
        c.month = month;
        c.eventsTotal = 0;
        c.eventsPoliticalViolence = 0;
        c.eventsCivilianTargeting = 0;
        c.eventsDemonstrations = 0;
        c.fatalitiesTotalPoliticalViolence = 0;
        c.fatalitiesTotalCivilianTargeting = 0;
      }
      if (month === c.month) {
        c.eventsTotal += events;
        if (eventType.includes('political_violence')) {
          c.eventsPoliticalViolence += events;
          c.fatalitiesTotalPoliticalViolence += fatalities;
        }
        if (eventType.includes('civilian_targeting')) {
          c.eventsCivilianTargeting += events;
          c.fatalitiesTotalCivilianTargeting += fatalities;
        }
        if (eventType.includes('demonstration')) {
          c.eventsDemonstrations += events;
        }
      }
    }

    const result = {
      success: true,
      count: Object.keys(byCountry).length,
      countries: Object.values(byCountry),
      cached_at: new Date().toISOString(),
    };

    fallbackCache = { data: result, timestamp: now };
    await setCachedJson(CACHE_KEY, result, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/hapi', 'MISS');

    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': RESPONSE_CACHE_CONTROL,
        'X-Cache': 'MISS',
      })
      .json(result);
  } catch (error) {
    if (isValidResult(fallbackCache.data)) {
      recordCacheTelemetry('/api/hapi', 'STALE');
      return res.status(200)
        .set({
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'STALE',
        })
        .json(fallbackCache.data);
    }

    recordCacheTelemetry('/api/hapi', 'ERROR');
    return res.status(500)
      .set({ 'Access-Control-Allow-Origin': '*' })
      .json({ error: `Fetch failed: ${toErrorMessage(error)}`, countries: [] });
  }
});

export { router };
