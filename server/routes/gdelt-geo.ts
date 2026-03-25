/**
 * GDELT Geo API proxy with security hardening
 */

import express from 'express';
import { getCachedJson, setCachedJson, hashString } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const ALLOWED_FORMATS = ['geojson', 'json', 'csv'];
const MAX_RECORDS = 500;
const MIN_RECORDS = 1;
const ALLOWED_TIMESPANS = ['1d', '7d', '14d', '30d', '60d', '90d'];
const CACHE_TTL_SECONDS = 300; // 5 minutes

function getCorsOrigin(req: express.Request): string {
  const origin = req.headers.origin || '';
  // Allow *.worldmonitor.app and localhost
  if (
    origin.endsWith('.worldmonitor.app') ||
    origin === 'https://worldmonitor.app' ||
    origin.startsWith('http://localhost:')
  ) {
    return origin;
  }
  return 'https://worldmonitor.app';
}

function validateMaxRecords(val: string | undefined): number {
  const num = parseInt(val || '250', 10);
  if (isNaN(num)) return 250;
  return Math.max(MIN_RECORDS, Math.min(MAX_RECORDS, num));
}

function validateFormat(val: string | undefined): string {
  return ALLOWED_FORMATS.includes(val || '') ? (val || 'geojson') : 'geojson';
}

function validateTimespan(val: string | undefined): string {
  return ALLOWED_TIMESPANS.includes(val || '') ? (val || '7d') : '7d';
}

function sanitizeQuery(val: string | undefined): string {
  if (!val || typeof val !== 'string') return 'protest';
  return val.slice(0, 200).replace(/[<>\"']/g, '');
}

router.get('/', async (req, res) => {
  const corsOrigin = getCorsOrigin(req);

  const query = sanitizeQuery(req.query.query as string);
  const format = validateFormat(req.query.format as string);
  const maxrecords = validateMaxRecords(req.query.maxrecords as string);
  const timespan = validateTimespan(req.query.timespan as string);

  // Create cache key
  const cacheKey = `gdelt:geo:${hashString(`${query}:${format}:${maxrecords}:${timespan}`)}`;

  // Try Redis cache first
  const cached = await getCachedJson(cacheKey);
  if (cached && typeof cached === 'string') {
    recordCacheTelemetry('/api/gdelt-geo', 'REDIS-HIT');
    return res.status(200)
      .set({
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'REDIS-HIT',
      })
      .send(cached);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&format=${format}&maxrecords=${maxrecords}&timespan=${timespan}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'WorldMonitor/1.0',
        },
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502)
        .set({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        })
        .json({ error: 'Upstream service unavailable' });
    }

    const data = await response.text();

    // Cache the result
    await setCachedJson(cacheKey, data, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/gdelt-geo', 'MISS');

    return res.status(200)
      .set({
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'MISS',
      })
      .send(data);
  } catch (error: any) {
    console.error('[GDELT] Fetch error:', error.message);
    return res.status(500)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      })
      .json({ error: 'Failed to fetch GDELT data' });
  }
});

// Handle OPTIONS preflight
router.options('/', (req, res) => {
  const corsOrigin = getCorsOrigin(req);
  res.status(204)
    .set({
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    .send();
});

export { router };
