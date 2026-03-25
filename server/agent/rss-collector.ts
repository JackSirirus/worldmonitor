/**
 * RSS Collector Agent
 * Collects and stores RSS feeds from configured sources
 */

import { query } from '../database/connection.js';
import { info, warn, error } from './task-logger.js';
import Parser from 'rss-parser';
import { classifyByKeyword } from '../services/threat-classifier.js';
import { analyzeSentiment } from '../services/sentiment-analysis.js';
import { getSourceTier } from '../config/source-tiers.js';

// RSS Parser instance
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'WorldMonitor/1.0 RSS Collector',
  },
});

// Source categories mapping (mirrors frontend feeds.ts)
const SOURCE_CATEGORIES: Record<string, string> = {
  // Defense & Security
  'Defense One': 'defense',
  'Breaking Defense': 'defense',
  'The War Zone': 'defense',
  'Defense News': 'defense',
  'Janes': 'defense',
  'CSIS': 'defense',
  'Pentagon': 'defense',
  'BBC World': 'intl',
  'NPR News': 'intl',
  'Guardian World': 'intl',
  'AP News': 'intl',
  'Reuters World': 'intl',
  'Al Jazeera': 'intl',
  'CNN World': 'intl',

  // Tech & Crypto
  'Hacker News': 'tech',
  'Ars Technica': 'tech',
  'The Verge': 'tech',
  'MIT Tech Review': 'tech',
  'TechCrunch': 'tech',
  'TechCrunch Startups': 'tech',
  'VentureBeat AI': 'tech',
  'AI News': 'crypto',
  'ArXiv AI': 'tech',

  // Finance & Economic
  'CNBC': 'economic',
  'MarketWatch': 'economic',
  'Yahoo Finance': 'economic',
  'Financial Times': 'economic',
  'Reuters Business': 'economic',

  // Government
  'White House': 'defense',
  'State Dept': 'defense',
  'Treasury': 'economic',
  'DOJ': 'defense',
  'Federal Reserve': 'economic',
  'SEC': 'economic',
  'UN News': 'intl',

  // International Relations
  'Chatham House': 'intl',
  'ECFR': 'intl',
  'Foreign Policy': 'intl',
  'Foreign Affairs': 'intl',
  'Atlantic Council': 'intl',
  'Middle East Institute': 'intl',

  // Think Tanks & Research
  'RAND': 'intl',
  'Brookings': 'intl',
  'Carnegie': 'intl',
  'FAS': 'tech',
  'NTI': 'defense',

  // OSINT & Monitoring
  'Bellingcat': 'defense',

  // Cyber Security
  'Krebs Security': 'tech',

  // Economic & Food Security
  'FAO News': 'economic',
};

// Complete RSS feed sources with URLs
const RSS_FEEDS: Array<{ name: string; url: string; type?: string }> = [
  // Tech & AI
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'tech' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'tech' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', type: 'tech' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'tech' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', type: 'tech' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', type: 'tech' },

  // Crypto
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', type: 'crypto' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', type: 'crypto' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed', type: 'crypto' },
  { name: 'The Block', url: 'https://www.theblock.co/feed', type: 'crypto' },

  // Defense & Security
  { name: 'Defense One', url: 'https://www.defenseone.com/rss/all/', type: 'defense' },
  { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', type: 'defense' },
  { name: 'Defense News', url: 'https://www.defensenews.com/feed/rss/', type: 'defense' },
  { name: 'Janes', url: 'https://www.janes.com/rss/', type: 'defense' },
  { name: 'War Zone', url: 'https://www.twz.com/feed', type: 'defense' },

  // Economic & Finance
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', type: 'economic' },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', type: 'economic' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/', type: 'economic' },
  { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'economic' },
  { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?taxonomy=business-finance&post_type=best', type: 'economic' },
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', type: 'economic' },

  // International
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', type: 'intl' },
  { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?taxonomy=world&post_type=best', type: 'intl' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', type: 'intl' },
  { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-topnews', type: 'intl' },
  { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', type: 'intl' },
  { name: 'Guardian World', url: 'https://www.theguardian.com/world/rss', type: 'intl' },
  { name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/', type: 'intl' },
  { name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/feed/', type: 'intl' },
];

// Export feeds for sync
export { RSS_FEEDS };

export interface RSSSource {
  id: number;
  url: string;
  name: string;
  category: string | null;
  last_fetch: Date | null;
  status: string;
  error_message: string | null;
}

export interface RSSItem {
  source_url: string;
  title: string;
  link: string;
  description: string | null;
  pub_date: Date | null;
  category: string | null;
}

/**
 * Get category from source name
 */
function getCategoryFromSource(sourceName: string): string | null {
  return SOURCE_CATEGORIES[sourceName] || null;
}

/**
 * Sync RSS sources from configuration to database
 */
export async function syncSourcesToDatabase(sources: Array<{ name: string; url: string; type?: string }>): Promise<number> {
  let synced = 0;

  for (const source of sources) {
    const category = source.type || getCategoryFromSource(source.name);
    const tier = getSourceTier(source.name);

    try {
      await query(`
        INSERT INTO rss_sources (url, name, category, tier, status)
        VALUES ($1, $2, $3, $4, 'pending')
        ON CONFLICT (url) DO UPDATE
        SET name = EXCLUDED.name, category = COALESCE(rss_sources.category, EXCLUDED.category), tier = COALESCE(rss_sources.tier, EXCLUDED.tier)
      `, [source.url, source.name, category, tier]);
      synced++;
    } catch (err) {
      console.error(`[RSS Collector] Failed to sync source ${source.name}:`, err);
    }
  }

  return synced;
}

/**
 * Fetch a single RSS source with retry logic
 */
async function fetchSource(source: RSSSource, maxRetries: number = 2): Promise<{ items: RSSItem[]; error?: string }> {
  let lastError: string = 'Unknown error';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const feed = await parser.parseURL(source.url);

      const items: RSSItem[] = (feed.items || []).map(item => {
        // Extract category from source mapping
        const category = source.category || getCategoryFromSource(source.name);

        return {
          source_url: source.url,
          title: item.title || 'Untitled',
          link: item.link || '',
          description: item.contentSnippet || item.content || null,
          pub_date: item.pubDate ? new Date(item.pubDate) : null,
          category,
        };
      }).filter(item => item.link); // Filter out items without links

      return { items };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';

      // Don't retry for certain errors that are unlikely to succeed on retry
      if (lastError.includes('ENOTFOUND') ||
          lastError.includes('ECONNREFUSED') ||
          lastError.includes('Invalid RSS') ||
          lastError.includes('Non-whitespace')) {
        break;
      }

      // Wait before retry (exponential backoff: 1s, 2s)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return { items: [], error: lastError };
}

/**
 * Fetch RSS sources with parallel execution and rate limiting
 */
export async function fetchRSSSources(
  sessionId: string,
  concurrency: number = 5
): Promise<{ collected: number; errors: number }> {
  info(sessionId, sessionId, 'Starting RSS collection');

  // Get all active sources
  const sources = await query<RSSSource>(`
    SELECT id, url, name, category, last_fetch, status, error_message
    FROM rss_sources
    ORDER BY last_fetch ASC NULLS FIRST
  `);

  if (sources.rows.length === 0) {
    warn(sessionId, sessionId, 'No RSS sources found in database');
    return { collected: 0, errors: 0 };
  }

  let collected = 0;
  let errors = 0;
  const now = new Date();

  // Process in batches
  for (let i = 0; i < sources.rows.length; i += concurrency) {
    const batch = sources.rows.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map(async (source) => {
        const result = await fetchSource(source);

        // Update source status
        if (result.error) {
          await query(`
            UPDATE rss_sources
            SET status = 'error', error_message = $1, last_checked = $2, response_time = NULL
            WHERE id = $3
          `, [result.error, now, source.id]);
          errors++;
          return { items: [], source };
        }

        // Insert items with duplicate detection, threat classification, and sentiment analysis
        let inserted = 0;
        for (const item of result.items) {
          try {
            // Classify using keyword matching (no AI API needed)
            const threat = classifyByKeyword(item.title);
            // Analyze sentiment using keyword matching
            const sentiment = analyzeSentiment(item.title);

            await query(`
              INSERT INTO rss_items (source_url, title, link, description, pub_date, category, threat_level, threat_category, sentiment_score, sentiment_label)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (link) DO NOTHING
            `, [item.source_url, item.title, item.link, item.description, item.pub_date, item.category, threat.level, threat.category, sentiment.score, sentiment.sentiment]);

            // Check if inserted (ON CONFLICT DO NOTHING doesn't return count)
            const existing = await query<{ id: number }>(
              'SELECT id FROM rss_items WHERE link = $1',
              [item.link]
            );
            if (existing.rows.length > 0) {
              inserted++;
            }
          } catch (err) {
            console.error(`[RSS Collector] Failed to insert item:`, err);
          }
        }

        // Update source status to OK
        await query(`
          UPDATE rss_sources
          SET status = 'ok', error_message = NULL, last_fetch = $1, last_checked = $1
          WHERE id = $2
        `, [now, source.id]);

        collected += inserted;
        return { items: result.items, source };
      })
    );

    // Small delay between batches to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  info(sessionId, sessionId, `RSS collection complete: ${collected} items collected, ${errors} errors`);
  return { collected, errors };
}

/**
 * Add RSS collector task to scheduler
 */
export function scheduleRSSCollector(cronExpr: string = '*/30 * * * *', callback?: () => void): void {
  // This will be integrated into the main scheduler
  // Called by scheduler.ts during initialization
  if (callback) {
    callback();
  }
}

/**
 * Run RSS collector (standalone)
 */
export async function runCollector(): Promise<void> {
  const sessionId = `rss-collector-${Date.now()}`;
  await fetchRSSSources(sessionId);
}

export default {
  syncSourcesToDatabase,
  fetchRSSSources,
  scheduleRSSCollector,
  runCollector,
  getCategoryFromSource,
};
