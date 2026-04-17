/**
 * News Tools for MCP Server
 * Phase 1: Basic news query tools
 */

import { getNews, getCategories, getSources, getNewsById } from '../../repositories/news.js';
import { getClusters } from '../../services/news-clustering.js';
import type { MCPToolResult } from '../types.js';

/**
 * Tool: get_latest_news
 * Get latest news with optional category/source filters
 */
export async function getLatestNews(args: {
  category?: string;
  source?: string;
  limit?: number;
  page?: number;
}): Promise<MCPToolResult> {
  try {
    const limit = Math.min(args.limit || 50, 100);
    const page = Math.max(args.page || 1, 1);

    const filters: Parameters<typeof getNews>[0] = {};

    if (args.category) {
      filters.category = args.category;
    }
    if (args.source) {
      filters.sourceUrl = args.source;
    }

    const result = await getNews(filters, { page, limit });

    // Transform items to have proper field names and ISO date strings
    const items = result.items.map(item => ({
      id: item.id,
      title: item.title,
      title_zh: item.title_zh,
      description: item.description,
      description_zh: item.description_zh,
      link: (item as any).url || item.link,
      pub_date: item.pub_date?.toISOString() || null,
      category: item.category,
      source: (item as any).source || item.source_url,
      threat_level: item.threat_level,
      threat_category: item.threat_category,
      sentiment_score: item.sentiment_score,
      sentiment_label: item.sentiment_label,
    }));

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: search_news
 * Search news by query string
 */
export async function searchNews(args: {
  query: string;
  category?: string;
  source?: string;
  limit?: number;
  page?: number;
}): Promise<MCPToolResult> {
  try {
    if (!args.query) {
      return {
        success: false,
        error: 'Search query is required',
      };
    }

    const limit = Math.min(args.limit || 50, 100);
    const page = Math.max(args.page || 1, 1);

    const filters: Parameters<typeof getNews>[0] = {
      search: args.query,
    };

    if (args.category) {
      filters.category = args.category;
    }
    if (args.source) {
      filters.sourceUrl = args.source;
    }

    const result = await getNews(filters, { page, limit });

    // Transform items to have proper field names and ISO date strings
    const items = result.items.map(item => ({
      id: item.id,
      title: item.title,
      title_zh: item.title_zh,
      description: item.description,
      description_zh: item.description_zh,
      link: (item as any).url || item.link,
      pub_date: item.pub_date?.toISOString() || null,
      category: item.category,
      source: (item as any).source || item.source_url,
      threat_level: item.threat_level,
      threat_category: item.threat_category,
      sentiment_score: item.sentiment_score,
      sentiment_label: item.sentiment_label,
    }));

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
        query: args.query,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_news_clusters
 * Get news clusters
 */
export async function getNewsClusters(args: {
  minItems?: number;
}): Promise<MCPToolResult> {
  try {
    const minItems = args.minItems || 2;
    const clusters = await getClusters(minItems);

    return {
      success: true,
      data: {
        clusters,
        count: clusters.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_recent_reports
 * Get recent reports
 */
export async function getRecentReports(args: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<MCPToolResult> {
  try {
    const { query } = await import('../../database/connection.js');

    const limit = Math.min(args.limit || 20, 100);
    const offset = args.offset || 0;

    let sql = 'SELECT id, title, format, category, period_start, period_end, created_at FROM reports';
    const params: (string | number)[] = [];

    if (args.category) {
      sql += ' WHERE category = $1';
      params.push(args.category);
      sql += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    } else {
      sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }

    const result = await query(sql, params);

    return {
      success: true,
      data: {
        reports: result.rows,
        limit,
        offset,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_news_sources
 * Get available news sources
 */
export async function getNewsSources(): Promise<MCPToolResult> {
  try {
    const sources = await getSources();

    return {
      success: true,
      data: {
        sources,
        count: sources.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_news_categories
 * Get available news categories
 */
export async function getNewsCategories(): Promise<MCPToolResult> {
  try {
    const categories = await getCategories();

    return {
      success: true,
      data: {
        categories,
        count: categories.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_news_by_id
 * Get a specific news item by ID
 */
export async function getNewsByIdTool(args: {
  id: number;
}): Promise<MCPToolResult> {
  try {
    if (!args.id || isNaN(args.id)) {
      return {
        success: false,
        error: 'Valid news ID is required',
      };
    }

    const news = await getNewsById(args.id);

    if (!news) {
      return {
        success: false,
        error: 'News item not found',
      };
    }

    return {
      success: true,
      data: {
        ...news,
        pub_date: news.pub_date?.toISOString() || null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
