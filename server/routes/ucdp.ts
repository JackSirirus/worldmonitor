/**
 * UCDP (Uppsala Conflict Data Program) proxy
 * Returns conflict classification per country with intensity levels
 * No auth required - public API
 * Redis cached (24h TTL)
 */

import express from 'express';
import { getCachedJson, setCachedJson } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const CACHE_KEY = 'ucdp:country-conflicts:v2';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours (annual data)
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const RESPONSE_CACHE_CONTROL = 'public, max-age=3600';

// In-memory fallback when Redis is unavailable.
let fallbackCache = { data: null, timestamp: 0 };

function isValidResult(data) {
  return Boolean(
    data &&
    typeof data === 'object' &&
    Array.isArray(data.conflicts)
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
    recordCacheTelemetry('/api/ucdp', 'REDIS-HIT');
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
    recordCacheTelemetry('/api/ucdp', 'MEMORY-HIT');
    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': RESPONSE_CACHE_CONTROL,
        'X-Cache': 'MEMORY-HIT',
      })
      .json(fallbackCache.data);
  }

  try {
    // Fetch all pages of conflicts
    let allConflicts = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const response = await fetch(`https://ucdpapi.pcr.uu.se/api/ucdpprioconflict/24.1?pagesize=100&page=${page}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`UCDP API error: ${response.status}`);
      }

      const rawData = await response.json() as any;
      totalPages = rawData.TotalPages || 1;
      const conflicts = rawData.Result || [];
      allConflicts = allConflicts.concat(conflicts);
      page++;
    }

    // Fields are snake_case: conflict_id, location, side_a, side_b, year, intensity_level, type_of_conflict
    const countryConflicts = {};
    for (const c of allConflicts) {
      const name = c.location || '';
      const year = parseInt(c.year, 10) || 0;
      const intensity = parseInt(c.intensity_level, 10) || 0;

      const entry = {
        conflictId: parseInt(c.conflict_id, 10) || 0,
        conflictName: c.side_b || '',
        location: name,
        year,
        intensityLevel: intensity,
        typeOfConflict: parseInt(c.type_of_conflict, 10) || 0,
        startDate: c.start_date,
        startDate2: c.start_date2,
        sideA: c.side_a,
        sideB: c.side_b,
        region: c.region,
      };

      // Keep most recent / highest intensity per location
      if (!countryConflicts[name] || year > countryConflicts[name].year ||
          (year === countryConflicts[name].year && intensity > countryConflicts[name].intensityLevel)) {
        countryConflicts[name] = entry;
      }
    }

    const result = {
      success: true,
      count: Object.keys(countryConflicts).length,
      conflicts: Object.values(countryConflicts),
      cached_at: new Date().toISOString(),
    };

    fallbackCache = { data: result, timestamp: now };
    await setCachedJson(CACHE_KEY, result, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/ucdp', 'MISS');

    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': RESPONSE_CACHE_CONTROL,
        'X-Cache': 'MISS',
      })
      .json(result);
  } catch (error) {
    if (isValidResult(fallbackCache.data)) {
      recordCacheTelemetry('/api/ucdp', 'STALE');
      return res.status(200)
        .set({
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=600',
          'X-Cache': 'STALE',
        })
        .json(fallbackCache.data);
    }

    recordCacheTelemetry('/api/ucdp', 'ERROR');
    return res.status(500)
      .set({ 'Access-Control-Allow-Origin': '*' })
      .json({ error: `Fetch failed: ${toErrorMessage(error)}`, conflicts: [] });
  }
});

export { router };
