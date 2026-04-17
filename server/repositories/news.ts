/**
 * News Repository
 * Handles data access for rss_items table
 */

import { query, transaction } from '../database/connection.js';

export interface NewsItem {
  id: number;
  source_url: string;
  title: string;
  title_zh?: string | null;
  link: string;
  description: string | null;
  description_zh?: string | null;
  pub_date: Date | null;
  category: string | null;
  fetched_at: Date;
  created_at: Date;
  threat_level?: string;
  threat_category?: string;
  sentiment_score?: number;
  sentiment_label?: string;
}

export interface NewsFilters {
  sourceUrl?: string;
  category?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Get paginated news items
 */
export async function getNews(
  filters: NewsFilters = {},
  pagination: PaginationParams = { page: 1, limit: 50 }
): Promise<{ items: NewsItem[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.sourceUrl) {
    conditions.push(`source_url = $${paramIndex++}`);
    params.push(filters.sourceUrl);
  }

  if (filters.category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(filters.category);
  }

  if (filters.fromDate) {
    conditions.push(`pub_date >= $${paramIndex++}`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`pub_date <= $${paramIndex++}`);
    params.push(filters.toDate);
  }

  if (filters.search) {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR title_zh ILIKE $${paramIndex} OR description_zh ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (pagination.page - 1) * pagination.limit;

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM rss_items ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get items - include source as alias for source_url, and threat classification, and Chinese translations
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  const itemsResult = await query<NewsItem>(
    `SELECT id, title, title_zh, description, description_zh, link as url, pub_date, category, source_url as source,
            threat_level, threat_category, sentiment_score, sentiment_label
     FROM rss_items ${whereClause}
     ORDER BY pub_date DESC NULLS LAST
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...params, pagination.limit, offset]
  );

  return {
    items: itemsResult.rows,
    total,
  };
}

/**
 * Get news item by ID
 */
export async function getNewsById(id: number): Promise<NewsItem | null> {
  const result = await query<NewsItem>(
    'SELECT * FROM rss_items WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get news item by link (for deduplication)
 */
export async function getNewsByLink(link: string): Promise<NewsItem | null> {
  const result = await query<NewsItem>(
    'SELECT * FROM rss_items WHERE link = $1',
    [link]
  );
  return result.rows[0] || null;
}

/**
 * Insert a new news item
 */
export async function insertNews(item: Omit<NewsItem, 'id' | 'fetched_at' | 'created_at'>): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO rss_items (source_url, title, link, description, pub_date, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [item.source_url, item.title, item.link, item.description, item.pub_date, item.category]
  );
  return result.rows[0].id;
}

/**
 * Batch insert news items (with deduplication)
 */
export async function batchInsertNews(
  items: Array<{ source_url: string; title: string; link: string; description?: string; pub_date?: Date; category?: string }>
): Promise<number> {
  if (items.length === 0) return 0;

  let inserted = 0;

  await transaction(async (client) => {
    for (const item of items) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO rss_items (source_url, title, link, description, pub_date, category)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (link) DO NOTHING
         RETURNING id`,
        [item.source_url, item.title, item.link, item.description || null, item.pub_date || null, item.category || null]
      );
      if (result.rows[0]) inserted++;
    }
  });

  return inserted;
}

/**
 * Get news count
 */
export async function getNewsCount(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM rss_items');
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Delete news older than specified date
 */
export async function deleteOldNews(olderThan: Date): Promise<number> {
  const result = await query<{ count: string }>(
    'DELETE FROM rss_items WHERE fetched_at < $1 RETURNING COUNT(*) as count',
    [olderThan]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get distinct categories
 */
export async function getCategories(): Promise<string[]> {
  const result = await query<{ category: string }>(
    'SELECT DISTINCT category FROM rss_items WHERE category IS NOT NULL ORDER BY category'
  );
  return result.rows.map(r => r.category);
}

/**
 * Get distinct sources
 */
export async function getSources(): Promise<Array<{ url: string; name: string }>> {
  const result = await query<{ url: string; name: string }>(
    `SELECT DISTINCT r.url, r.name
     FROM rss_sources r
     INNER JOIN rss_items i ON r.url = i.source_url
     ORDER BY r.name`
  );
  return result.rows;
}

/**
 * Update translation fields for a news item
 */
export async function updateNewsTranslation(
  id: number,
  title_zh: string,
  description_zh: string
): Promise<void> {
  await query(
    `UPDATE rss_items
     SET title_zh = $2, description_zh = $3
     WHERE id = $1`,
    [id, title_zh, description_zh]
  );
}

/**
 * Get news items that need translation (no Chinese translation yet)
 */
export async function getNewsNeedingTranslation(limit: number = 100): Promise<NewsItem[]> {
  const result = await query<NewsItem>(
    `SELECT id, title, description, link
     FROM rss_items
     WHERE (title_zh IS NULL OR description_zh IS NULL)
       AND created_at > NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export default {
  getNews,
  getNewsById,
  getNewsByLink,
  insertNews,
  batchInsertNews,
  getNewsCount,
  deleteOldNews,
  getCategories,
  getSources,
  updateNewsTranslation,
  getNewsNeedingTranslation,
};
