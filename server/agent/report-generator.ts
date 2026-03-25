/**
 * Report Generator
 * Generates Markdown reports from news data with category support
 */

import { query } from '../database/connection.js';
import { simpleChat } from '../services/ai-providers.js';
import { runSearch } from './web-search.js';
import { info, warn, error } from './task-logger.js';

export interface Report {
  id: number;
  title: string;
  content: string;
  format: string;
  category: string | null;
  period_start: Date | null;
  period_end: Date | null;
  created_at: Date;
}

export type ReportCategory = 'tech' | 'world' | 'daily' | 'weekly';

// Category to RSS category mapping
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  tech: ['tech', 'cyber', 'ai', 'science'],
  world: ['defense', 'intl', 'economic', 'political', 'research', 'osint'],
};

// Report prompts configuration
const REPORT_PROMPTS: Record<ReportCategory, {
  title: (date: string) => string;
  prompt: (headlines: string) => string;
}> = {
  tech: {
    title: (date: string) => `Tech Daily Brief - ${date}`,
    prompt: (headlines: string) => `You are a tech news analyst. Provide a comprehensive summary of the following tech news headlines from the last 24 hours. Focus on:
1. Major technology companies and product announcements
2. AI and machine learning developments
3. Cybersecurity threats and incidents
4. Scientific breakthroughs
5. Emerging technologies

Keep it concise (3-5 paragraphs) and use professional tone.`,
  },
  world: {
    title: (date: string) => `World Daily Brief - ${date}`,
    prompt: (headlines: string) => `You are a geopolitical news analyst. Provide a comprehensive summary of the following world news headlines from the last 24 hours. Focus on:
1. Geopolitical events and conflicts
2. International relations and diplomacy
3. Defense and security developments
4. Economic and trade news
5. Humanitarian crises

Keep it concise (3-5 paragraphs) and use professional tone.`,
  },
  daily: {
    title: (date: string) => `Daily Summary - ${date}`,
    prompt: (headlines: string) => `You are a news analyst. Provide a brief summary of the following news headlines from the last 24 hours. Focus on the most important stories and trends. Keep it concise (3-5 paragraphs).`,
  },
  weekly: {
    title: (date: string) => `Weekly Trend Analysis - ${date}`,
    prompt: (headlines: string) => `You are a news analyst. Analyze the following news headlines from the past week. Identify:
1. Major trends and themes
2. Emerging stories
3. Topics that received significant coverage
4. Any notable shifts from previous weeks

Provide a comprehensive weekly trend report.`,
  },
};

// Data sufficiency threshold
const MIN_ITEMS_THRESHOLD = 50;

/**
 * Get items by category
 */
async function getItemsByCategory(
  category: ReportCategory,
  hours: number = 24,
  limit: number = 100
): Promise<Array<{ title: string; source_url: string; pub_date: Date; category: string | null }>> {
  const mappedCategories = CATEGORY_MAPPINGS[category];

  let sql = `
    SELECT i.title, i.source_url, i.pub_date, i.category
    FROM rss_items i
    WHERE i.fetched_at > NOW() - INTERVAL '${hours} hours'
  `;

  const params: any[] = [];

  if (mappedCategories && mappedCategories.length > 0) {
    // Include items matching category or from search
    const categoryConditions = mappedCategories.map((_, idx) => `$${idx + 1}`).join(', ');
    sql += ` AND (i.category IN (${categoryConditions}) OR i.source_url LIKE 'search:%')`;
    params.push(...mappedCategories);
  }

  sql += ` ORDER BY i.pub_date DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query<{ title: string; source_url: string; pub_date: Date; category: string | null }>(sql, params);
  return result.rows;
}

/**
 * Check if data is sufficient
 */
function isDataSufficient(items: unknown[]): boolean {
  return items.length >= MIN_ITEMS_THRESHOLD;
}

/**
 * Trigger web search for additional data
 */
async function supplementWithSearch(
  category: ReportCategory,
  sessionId: string
): Promise<void> {
  const searchQueries: Record<ReportCategory, string[]> = {
    tech: [
      'latest technology news today',
      'AI artificial intelligence breakthrough',
      'cybersecurity threat news',
    ],
    world: [
      'latest geopolitical news today',
      'international conflict news',
      'global economic news',
    ],
    daily: [
      'breaking news today',
    ],
    weekly: [
      'major news stories this week',
    ],
  };

  const queries = searchQueries[category] || searchQueries.daily;

  for (const q of queries) {
    try {
      await runSearch(q, sessionId, { limit: 5, store: true });
      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      warn(sessionId, sessionId, `Supplement search failed for "${q}": ${err}`);
    }
  }
}

/**
 * Generate category-specific report
 */
async function generateCategoryReport(
  category: ReportCategory,
  sessionId: string
): Promise<Report | null> {
  const hours = category === 'weekly' ? 168 : 24; // 7 days for weekly
  const items = await getItemsByCategory(category, hours);

  if (items.length === 0) {
    warn(sessionId, sessionId, `No items found for category: ${category}`);
    return null;
  }

  // Check data sufficiency
  if (!isDataSufficient(items)) {
    warn(sessionId, sessionId, `Insufficient data for ${category} (${items.length} items), supplementing with search...`);
    await supplementWithSearch(category, sessionId);

    // Re-fetch after supplementation
    const newItems = await getItemsByCategory(category, hours);
    if (newItems.length < items.length / 2) {
      // Still not enough, proceed with what we have but log
      warn(sessionId, sessionId, `Proceeding with limited data: ${newItems.length} items`);
    }
  }

  const headlines = items.map(i => `- ${i.title}`).join('\n');
  const config = REPORT_PROMPTS[category];
  const date = new Date().toISOString().split('T')[0];

  const summary = await simpleChat(config.prompt(headlines), headlines, {
    temperature: 0.5,
  });

  // Check for duplicate report today
  const existing = await query<{ id: number }>(`
    SELECT id FROM reports
    WHERE category = $1 AND created_at > NOW() - INTERVAL '12 hours'
  `, [category]);

  if (existing.rows.length > 0) {
    info(sessionId, sessionId, `Report for ${category} already exists today, skipping`);
    return null;
  }

  const report = await query<Report>(`
    INSERT INTO reports (title, content, format, category, period_start, period_end)
    VALUES ($1, $2, 'markdown', $3, NOW() - INTERVAL '${hours} hours', NOW())
    RETURNING *
  `, [config.title(date), summary, category]);

  info(sessionId, sessionId, `Report created: ${report.rows[0].id} (${category})`);
  return report.rows[0];
}

/**
 * Generate daily summary report (all categories)
 */
export async function generateDailySummary(): Promise<Report[]> {
  const sessionId = `report-daily-${Date.now()}`;
  info(sessionId, sessionId, 'Starting daily report generation');

  const reports: Report[] = [];

  // Generate tech and world reports in parallel
  const [techReport, worldReport] = await Promise.all([
    generateCategoryReport('tech', sessionId),
    generateCategoryReport('world', sessionId),
  ]);

  if (techReport) reports.push(techReport);
  if (worldReport) reports.push(worldReport);

  info(sessionId, sessionId, `Daily reports generated: ${reports.length}`);
  return reports;
}

/**
 * Generate weekly trend analysis report
 */
export async function generateWeeklyTrend(): Promise<Report> {
  const sessionId = `report-weekly-${Date.now()}`;
  info(sessionId, sessionId, 'Starting weekly trend analysis');

  const report = await generateCategoryReport('weekly', sessionId);

  if (report) {
    info(sessionId, sessionId, `Weekly report created: ${report.id}`);
  }

  return report;
}

/**
 * Generate report by category (manual trigger)
 */
export async function generateReport(category: ReportCategory): Promise<Report | null> {
  const sessionId = `report-${category}-${Date.now()}`;
  return generateCategoryReport(category, sessionId);
}

/**
 * Get recent reports
 */
export async function getRecentReports(limit: number = 10): Promise<Report[]> {
  const result = await query<Report>(`
    SELECT * FROM reports
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

export default {
  generateDailySummary,
  generateWeeklyTrend,
  generateReport,
  getRecentReports,
  CATEGORY_MAPPINGS,
  REPORT_PROMPTS,
  MIN_ITEMS_THRESHOLD,
};
