/**
 * MCP Server Type Definitions
 * Shared types for WorldMonitor MCP tools
 */

export interface NewsItem {
  id: number;
  title: string;
  title_zh?: string | null;
  description: string | null;
  description_zh?: string | null;
  link: string;
  pub_date: string | null;
  category: string | null;
  source: string;
  threat_level?: string;
  threat_category?: string;
  sentiment_score?: number;
  sentiment_label?: string;
}

export interface NewsFilters {
  sourceUrl?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface NewsResponse {
  items: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SearchResponse {
  items: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  query: string;
}

export interface NewsCluster {
  id: string;
  primaryTitle: string;
  primaryLink: string;
  primarySource: string;
  sourceCount: number;
  topSources: Array<{ name: string; tier: number; url: string }>;
  allItems: Array<{
    source: string;
    title: string;
    link: string;
    pubDate: string;
    isAlert: boolean;
    threat?: { level: string; category: string };
  }>;
  firstSeen: string;
  lastUpdated: string;
  isAlert: boolean;
  monitorColor?: string;
  velocity?: {
    sourcesPerHour: number;
    level: string;
    trend: string;
    sentiment: string;
    sentimentScore: number;
  };
  threat?: { level: string; category: string };
  keywords: string[];
}

export interface Report {
  id: number;
  title: string;
  format: string;
  category: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface Source {
  url: string;
  name: string;
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
