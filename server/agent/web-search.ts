/**
 * Web Search Agent
 * Multi-provider search with fallback chain
 */

import { info, warn, error } from './task-logger.js';
import fetch from 'node-fetch';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface SearchResponse {
  results: SearchResult[];
  provider: string;
  query: string;
}

/**
 * Search using DuckDuckGo Instant Answer API (free, no API key)
 */
async function searchDuckDuckGo(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    // DuckDuckGo Instant Answer API
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      {
        headers: {
          'User-Agent': 'WorldMonitor/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json() as any;

    // Extract RelatedTopics
    const results: SearchResult[] = [];

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= limit) break;

        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'duckduckgo',
          });
        }
      }
    }

    // Also check AbstractText if no related topics
    if (results.length === 0 && data.AbstractText) {
      results.push({
        title: data.AbstractTitle || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        source: 'duckduckgo',
      });
    }

    return results;
  } catch (err) {
    console.error('[WebSearch] DuckDuckGo failed:', err);
    throw err;
  }
}

/**
 * Search using DuckDuckGo HTML SERP scraper (fallback)
 */
async function searchDuckDuckGoHTML(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo HTML error: ${response.status}`);
    }

    const html = await response.text();

    // Simple regex-based parsing (avoid heavy dependencies)
    const results: SearchResult[] = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    const snippetRegex = /<a class="result__snippet"[^>]*>([^<]+)<\/a>/g;

    let match;
    let snippets: string[] = [];

    // Extract snippets first
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < limit) {
      snippets.push(match[1].replace(/<[^>]+>/g, '').trim());
    }

    // Reset regex
    regex.lastIndex = 0;

    let index = 0;
    while ((match = regex.exec(html)) !== null && results.length < limit) {
      const url = decodeURIComponent(match[1]);
      // Skip DuckDuckGo internal links
      if (url.startsWith('//duckduckgo.com') || url.includes('uddg=')) {
        continue;
      }

      results.push({
        title: match[2].replace(/<[^>]+>/g, '').trim(),
        url: url,
        snippet: snippets[index] || '',
        source: 'duckduckgo-html',
      });
      index++;
    }

    return results;
  } catch (err) {
    console.error('[WebSearch] DuckDuckGo HTML failed:', err);
    throw err;
  }
}

/**
 * Search using Brave API (requires API key)
 */
async function searchBrave(query: string, limit: number = 10): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error('Brave Search API key not configured');
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
          'User-Agent': 'WorldMonitor/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave Search error: ${response.status}`);
    }

    const data = await response.json() as any;

    const results: SearchResult[] = [];

    if (data.web && data.web.results) {
      for (const item of data.web.results) {
        results.push({
          title: item.title || '',
          url: item.url || '',
          snippet: item.description || '',
          source: 'brave',
        });
      }
    }

    return results;
  } catch (err) {
    console.error('[WebSearch] Brave failed:', err);
    throw err;
  }
}

/**
 * Search using Tavily API (requires API key)
 */
async function searchTavily(query: string, limit: number = 10): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('Tavily API key not configured');
  }

  try {
    const response = await fetch(
      'https://api.tavily.com/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          max_results: limit,
          include_answer: false,
          include_raw_content: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Tavily error: ${response.status}`);
    }

    const data = await response.json() as any;

    const results: SearchResult[] = [];

    if (data.results) {
      for (const item of data.results) {
        results.push({
          title: item.title || '',
          url: item.url || '',
          snippet: item.content || '',
          source: 'tavily',
        });
      }
    }

    return results;
  } catch (err) {
    console.error('[WebSearch] Tavily failed:', err);
    throw err;
  }
}

/**
 * Main search function with fallback chain
 */
export async function webSearch(
  query: string,
  sessionId: string,
  options: {
    limit?: number;
    providers?: string[];
  } = {}
): Promise<SearchResponse> {
  const { limit = 10, providers = ['ddg', 'ddg-html', 'brave', 'tavily'] } = options;

  info(sessionId, sessionId, `Searching: ${query}`);

  const errors: string[] = [];

  // Try each provider in order
  for (const provider of providers) {
    try {
      let results: SearchResult[] = [];

      switch (provider) {
        case 'ddg':
          results = await searchDuckDuckGo(query, limit);
          break;
        case 'ddg-html':
          results = await searchDuckDuckGoHTML(query, limit);
          break;
        case 'brave':
          results = await searchBrave(query, limit);
          break;
        case 'tavily':
          results = await searchTavily(query, limit);
          break;
        default:
          continue;
      }

      if (results.length > 0) {
        info(sessionId, sessionId, `Search successful with ${provider}: ${results.length} results`);
        return {
          results,
          provider,
          query,
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${provider}: ${errorMsg}`);
      warn(sessionId, sessionId, `Provider ${provider} failed: ${errorMsg}`);
    }
  }

  error(sessionId, sessionId, `All search providers failed: ${errors.join(', ')}`);
  throw new Error(`Search failed. Errors: ${errors.join(', ')}`);
}

/**
 * Store search results to database
 */
export async function storeSearchResults(
  sessionId: string,
  searchResponse: SearchResponse
): Promise<number> {
  const { query } = await import('../database/connection.js');

  let stored = 0;

  for (const result of searchResponse.results) {
    try {
      await query(`
        INSERT INTO rss_items (source_url, title, link, description, category)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (link) DO NOTHING
      `, [
        `search:${searchResponse.provider}`,
        result.title,
        result.url,
        result.snippet,
        'search',
      ]);
      stored++;
    } catch (err) {
      console.error('[WebSearch] Failed to store result:', err);
    }
  }

  return stored;
}

/**
 * Run search with storage (for scheduled tasks)
 */
export async function runSearch(
  query: string,
  sessionId: string,
  options?: {
    limit?: number;
    providers?: string[];
    store?: boolean;
  }
): Promise<SearchResponse> {
  const searchResponse = await webSearch(query, sessionId, options);

  if (options?.store !== false) {
    await storeSearchResults(sessionId, searchResponse);
  }

  return searchResponse;
}

export default {
  webSearch,
  storeSearchResults,
  runSearch,
  searchDuckDuckGo,
  searchDuckDuckGoHTML,
  searchBrave,
  searchTavily,
};
