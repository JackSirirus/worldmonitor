/**
 * RSS Cache Service
 * Handles RSS feed caching with PostgreSQL storage
 */

import { query, transaction } from '../database/connection.js';
import type { PoolClient } from 'pg';

export interface RSSSource {
  id: number;
  url: string;
  name: string;
  category: string | null;
  last_fetch: Date | null;
  fetch_interval: number;
  status: 'pending' | 'ok' | 'warning' | 'error';
  error_message: string | null;
  response_time: number | null;
  last_checked: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RSSItem {
  id: number;
  source_url: string;
  title: string;
  link: string;
  description: string | null;
  pub_date: Date | null;
  fetched_at: Date;
  created_at: Date;
}

export interface CacheOptions {
  forceRefresh?: boolean;
  category?: string;
}

// Default fetch interval: 2 hours
const DEFAULT_FETCH_INTERVAL = 2 * 60 * 60 * 1000;

/**
 * Get all RSS sources
 */
export async function getSources(): Promise<RSSSource[]> {
  const result = await query<RSSSource>('SELECT * FROM rss_sources ORDER BY name');
  return result.rows;
}

/**
 * Get sources by category
 */
export async function getSourcesByCategory(category: string): Promise<RSSSource[]> {
  const result = await query<RSSSource>(
    'SELECT * FROM rss_sources WHERE category = $1 ORDER BY name',
    [category]
  );
  return result.rows;
}

/**
 * Get a single source by URL
 */
export async function getSourceByUrl(url: string): Promise<RSSSource | null> {
  const result = await query<RSSSource>(
    'SELECT * FROM rss_sources WHERE url = $1',
    [url]
  );
  return result.rows[0] || null;
}

/**
 * Add or update a source
 */
export async function upsertSource(
  url: string,
  name: string,
  category?: string
): Promise<RSSSource> {
  const result = await query<RSSSource>(
    `INSERT INTO rss_sources (url, name, category, fetch_interval)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (url) DO UPDATE SET
       name = EXCLUDED.name,
       category = COALESCE(EXCLUDED.category, rss_sources.category),
       updated_at = NOW()
     RETURNING *`,
    [url, name, category || null, DEFAULT_FETCH_INTERVAL]
  );
  return result.rows[0];
}

/**
 * Update source status after fetch
 */
export async function updateSourceStatus(
  url: string,
  status: RSSSource['status'],
  responseTime: number,
  errorMessage?: string
): Promise<void> {
  await query(
    `UPDATE rss_sources SET
       status = $1,
       response_time = $2,
       error_message = $3,
       last_fetch = NOW(),
       last_checked = NOW(),
       updated_at = NOW()
     WHERE url = $4`,
    [status, responseTime, errorMessage || null, url]
  );
}

/**
 * Check if source needs refresh
 */
export function needsRefresh(source: RSSSource, forceRefresh: boolean): boolean {
  if (forceRefresh) return true;
  if (!source.last_fetch) return true;

  const now = Date.now();
  const lastFetch = source.last_fetch.getTime();
  const interval = source.fetch_interval || DEFAULT_FETCH_INTERVAL;

  return (now - lastFetch) > interval;
}

/**
 * Add RSS items with duplicate detection
 */
export async function addItems(
  sourceUrl: string,
  items: Array<{ title: string; link: string; description?: string; pubDate?: Date }>
): Promise<number> {
  if (items.length === 0) return 0;

  let addedCount = 0;

  await transaction(async (client: PoolClient) => {
    for (const item of items) {
      try {
        await client.query(
          `INSERT INTO rss_items (source_url, title, link, description, pub_date, fetched_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (link) DO NOTHING`,
          [sourceUrl, item.title, item.link, item.description || null, item.pubDate || null]
        );
        addedCount++;
      } catch (err) {
        console.error('[RSS Cache] Error adding item:', err);
      }
    }
  });

  return addedCount;
}

/**
 * Get cached items for a source
 */
export async function getItemsBySource(
  sourceUrl: string,
  limit: number = 100
): Promise<RSSItem[]> {
  const result = await query<RSSItem>(
    `SELECT * FROM rss_items
     WHERE source_url = $1
     ORDER BY pub_date DESC NULLS LAST
     LIMIT $2`,
    [sourceUrl, limit]
  );
  return result.rows;
}

/**
 * Get cached items for a category
 */
export async function getItemsByCategory(
  category: string,
  limit: number = 500
): Promise<RSSItem[]> {
  const result = await query<RSSItem>(
    `SELECT i.* FROM rss_items i
     INNER JOIN rss_sources s ON i.source_url = s.url
     WHERE s.category = $1
     ORDER BY i.pub_date DESC NULLS LAST
     LIMIT $2`,
    [category, limit]
  );
  return result.rows;
}

/**
 * Get recent items across all sources
 */
export async function getRecentItems(limit: number = 100): Promise<RSSItem[]> {
  const result = await query<RSSItem>(
    `SELECT * FROM rss_items
     ORDER BY fetched_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Delete items older than specified days
 */
export async function deleteOldItems(retentionDays: number = 90): Promise<number> {
  interface DeleteResult {
    count: string;
  }

  const deleteResult = await query<DeleteResult>(
    `WITH deleted AS (
      DELETE FROM rss_items
      WHERE fetched_at < NOW() - INTERVAL '1 day' * $1
      RETURNING id
    ) SELECT COUNT(*) as count FROM deleted`,
    [retentionDays]
  );

  return parseInt(deleteResult.rows[0]?.count || '0');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalSources: number;
  okSources: number;
  errorSources: number;
  totalItems: number;
  oldestItem: Date | null;
  newestItem: Date | null;
}> {
  const sourcesResult = await query<{ total: string; ok: string; error: string }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'ok') as ok,
       COUNT(*) FILTER (WHERE status = 'error') as error
     FROM rss_sources`
  );

  const itemsResult = await query<{ total: string; oldest: Date; newest: Date }>(
    `SELECT
       COUNT(*) as total,
       MIN(fetched_at) as oldest,
       MAX(fetched_at) as newest
     FROM rss_items`
  );

  return {
    totalSources: parseInt(sourcesResult.rows[0]?.total || '0'),
    okSources: parseInt(sourcesResult.rows[0]?.ok || '0'),
    errorSources: parseInt(sourcesResult.rows[0]?.error || '0'),
    totalItems: parseInt(itemsResult.rows[0]?.total || '0'),
    oldestItem: itemsResult.rows[0]?.oldest || null,
    newestItem: itemsResult.rows[0]?.newest || null,
  };
}

export default {
  getSources,
  getSourcesByCategory,
  getSourceByUrl,
  upsertSource,
  updateSourceStatus,
  needsRefresh,
  addItems,
  getItemsBySource,
  getItemsByCategory,
  getRecentItems,
  deleteOldItems,
  getCacheStats,
};
