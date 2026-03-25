/**
 * GDELT Document API
 * Searches GDELT for news articles matching a query
 * Redis cached (5min TTL)
 */

import express from 'express';
import { getCachedJson, setCachedJson, hashString } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const MAX_RECORDS = 20;
const DEFAULT_RECORDS = 10;
const CACHE_TTL_SECONDS = 300; // 5 minutes

router.get('/', async (req, res) => {
  const query = req.query.query as string;
  const maxrecords = Math.min(
    parseInt(req.query.maxrecords as string || String(DEFAULT_RECORDS), 10),
    MAX_RECORDS
  );
  const timespan = (req.query.timespan as string) || '72h';

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  // Create cache key based on query params
  const cacheKey = `gdelt:doc:${hashString(`${query}:${maxrecords}:${timespan}`)}`;

  // Try Redis cache first
  const cached = await getCachedJson(cacheKey) as any;
  if (cached && typeof cached === 'object' && cached.articles) {
    recordCacheTelemetry('/api/gdelt-doc', 'REDIS-HIT');
    return res.status(200)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'REDIS-HIT',
      })
      .json({ ...cached, query });
  }

  try {
    const gdeltUrl = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    gdeltUrl.searchParams.set('query', query);
    gdeltUrl.searchParams.set('mode', 'artlist');
    gdeltUrl.searchParams.set('maxrecords', maxrecords.toString());
    gdeltUrl.searchParams.set('format', 'json');
    gdeltUrl.searchParams.set('sort', 'date');
    gdeltUrl.searchParams.set('timespan', timespan);

    const response = await fetch(gdeltUrl.toString());

    if (!response.ok) {
      throw new Error(`GDELT returned ${response.status}`);
    }

    const data = await response.json() as any;

    const articles = (data.articles || []).map((article: any) => ({
      title: article.title,
      url: article.url,
      source: article.domain || article.source?.domain,
      date: article.seendate,
      image: article.socialimage,
      language: article.language,
      tone: article.tone,
    }));

    const result = { articles, query };
    await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/gdelt-doc', 'MISS');

    return res.status(200)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'MISS',
      })
      .json(result);
  } catch (error: any) {
    recordCacheTelemetry('/api/gdelt-doc', 'ERROR');
    return res.status(500).json({ error: error.message, articles: [] });
  }
});

export { router };
