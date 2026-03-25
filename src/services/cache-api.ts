/**
 * Cache API Client for Frontend
 * Provides access to server-side RSS cache
 */

export interface CacheNewsItem {
  id: number;
  title: string;
  link: string;
  pub_date: string;
  source_url: string;
  source_name: string;
  category: string | null;
  fetched_at: string;
}

export interface CacheNewsResponse {
  items: CacheNewsItem[];
  count: number;
  category: string;
  cached: boolean;
}

export interface CacheSource {
  id: number;
  name: string;
  url: string;
  category: string | null;
  status: 'ok' | 'error' | 'warning';
  last_fetch: string | null;
  response_time_ms: number | null;
  error_message: string | null;
}

export interface CacheSourcesResponse {
  sources: CacheSource[];
  total: number;
  ok: number;
  error: number;
  warning: number;
}

export interface CacheStats {
  total_items: number;
  total_sources: number;
  sources_ok: number;
  sources_error: number;
  oldest_item: string | null;
  newest_item: string | null;
  cache_hit_today: number;
  cache_miss_today: number;
}

/**
 * Fetch cached news from server
 */
export async function fetchCachedNews(options: {
  category?: string;
  forceRefresh?: boolean;
  limit?: number;
} = {}): Promise<CacheNewsResponse> {
  const params = new URLSearchParams();

  if (options.category) params.set('category', options.category);
  if (options.forceRefresh) params.set('forceRefresh', 'true');
  if (options.limit) params.set('limit', String(options.limit));

  const url = `/api/cache/news${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Cache API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch cache sources status
 */
export async function fetchCacheSources(): Promise<CacheSourcesResponse> {
  const res = await fetch('/api/cache/sources');

  if (!res.ok) {
    throw new Error(`Cache sources API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch cache statistics
 */
export async function fetchCacheStats(): Promise<CacheStats> {
  const res = await fetch('/api/cache/stats');

  if (!res.ok) {
    throw new Error(`Cache stats API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Convert cache news item to frontend NewsItem format
 */
export function convertToNewsItem(cacheItem: CacheNewsItem) {
  return {
    title: cacheItem.title,
    link: cacheItem.link,
    pubDate: new Date(cacheItem.pub_date),
    source: cacheItem.source_name,
    isAlert: false,
  };
}
