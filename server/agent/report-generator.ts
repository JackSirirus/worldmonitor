/**
 * Report Generator
 * Generates Markdown reports from news data with category support
 * Enhanced with structured prompts, deduplication, and multi-language support
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

// ============================================================================
// Language Configuration
// ============================================================================

export type Language = 'zh' | 'en';

export const LANGUAGE_CONFIG: Record<Language, {
  respondIn: string;
  dateFormat: string;
}> = {
  zh: {
    respondIn: '中文',
    dateFormat: 'YYYY年MM月DD日',
  },
  en: {
    respondIn: 'English',
    dateFormat: 'YYYY-MM-DD',
  },
};

// ============================================================================
// Headline Preprocessing - Deduplication & Sampling
// ============================================================================

/**
 * Compute Jaccard similarity between two headlines (n-gram based)
 */
function jaccardSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const setA = new Set(normalize(a));
  const setB = new Set(normalize(b));

  const intersection = new Set(Array.from(setA).filter(x => setB.has(x)));
  const union = new Set([...Array.from(setA), ...Array.from(setB)]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Deduplicate headlines by Jaccard similarity threshold
 */
function deduplicateHeadlines(
  headlines: Array<{ title: string; pub_date: Date }>,
  similarityThreshold: number = 0.6
): Array<{ title: string; pub_date: Date }> {
  const result: Array<{ title: string; pub_date: Date }> = [];

  for (const headline of headlines) {
    const isDuplicate = result.some(existing =>
      jaccardSimilarity(existing.title, headline.title) >= similarityThreshold
    );

    if (!isDuplicate) {
      result.push(headline);
    }
  }

  return result;
}

/**
 * Sample headlines by recency with max limit
 * Prioritizes recent headlines but ensures some coverage from the full window
 */
function sampleByRecency(
  headlines: Array<{ title: string; pub_date: Date }>,
  maxItems: number = 80
): Array<{ title: string; pub_date: Date }> {
  if (headlines.length <= maxItems) {
    return headlines;
  }

  // Split into recent (6h) and older buckets
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const recent = headlines.filter(h => h.pub_date >= sixHoursAgo);
  const mid = headlines.filter(h => h.pub_date >= twelveHoursAgo && h.pub_date < sixHoursAgo);
  const older = headlines.filter(h => h.pub_date < twelveHoursAgo);

  const result: Array<{ title: string; pub_date: Date }> = [];

  // Include all recent headlines (most valuable)
  const recentLimit = Math.min(maxItems * 0.5, recent.length);
  result.push(...recent.slice(0, recentLimit));

  // Fill remaining slots from mid and older buckets
  const remaining = maxItems - result.length;
  if (remaining > 0 && mid.length > 0) {
    const midSample = Math.min(remaining * 0.3, mid.length);
    result.push(...mid.slice(0, midSample));
  }

  const stillRemaining = maxItems - result.length;
  if (stillRemaining > 0 && older.length > 0) {
    result.push(...older.slice(0, stillRemaining));
  }

  return result;
}

// ============================================================================
// Report Prompts - Structured with Anti-hallucination Constraints
// ============================================================================

type PromptConfig = {
  title: (date: string, lang: Language) => string;
  prompt: (headlines: string, lang: Language) => string;
};

const REPORT_PROMPTS: Record<ReportCategory, PromptConfig> = {
  tech: {
    title: (date: string, lang: Language) =>
      lang === 'zh' ? `科技每日简报 - ${date}` : `Tech Daily Brief - ${date}`,

    prompt: (headlines: string, lang: Language) => `
# Role
You are a senior tech news analyst who excels at extracting core insights from fragmented information.

# Input Format
You will receive a list of tech news headlines from the past 24 hours, each formatted as "- headline text".
"""
${headlines}
"""

# Constraints
- Do NOT translate headlines line by line — aggregate related headlines into 3-5 core themes
- Do NOT fabricate facts not present in the headlines
- If information is insufficient for a theme, acknowledge it objectively
- Respond in ${lang === 'zh' ? 'Chinese (中文)' : 'English'}
- Maximum 5 key themes, each with 2-3 bullet points

# Output Format (MUST follow)
## [Theme Name 1]
**Key Points:**
- [Point 1 from headlines]
- [Point 2 from headlines]

## [Theme Name 2]
**Key Points:**
- [Point 1]
- [Point 2]

## [Theme Name 3]
...

## [Trend Insight]
A brief 2-sentence summary of the overall tech landscape today.`,
  },

  world: {
    title: (date: string, lang: Language) =>
      lang === 'zh' ? `全球每日简报 - ${date}` : `World Daily Brief - ${date}`,

    prompt: (headlines: string, lang: Language) => `
# Role
You are a geopolitical news analyst specializing in international relations and security.

# Input Format
You will receive a list of world news headlines from the past 24 hours, each formatted as "- headline text".
"""
${headlines}
"""

# Constraints
- Do NOT translate headlines line by line — aggregate related headlines into 3-5 core themes
- Focus on: geopolitical events, conflicts, diplomacy, defense, economy, humanitarian issues
- Do NOT fabricate facts not present in the headlines
- If information is insufficient for a theme, acknowledge it objectively
- Respond in ${lang === 'zh' ? 'Chinese (中文)' : 'English'}
- Maximum 5 key themes, each with 2-3 bullet points

# Output Format (MUST follow)
## [Theme Name 1]
**Key Points:**
- [Point 1 from headlines]
- [Point 2 from headlines]

## [Theme Name 2]
**Key Points:**
- [Point 1]
- [Point 2]

## [Trend Insight]
A brief 2-sentence summary of the overall geopolitical situation today.`,
  },

  daily: {
    title: (date: string, lang: Language) =>
      lang === 'zh' ? `每日新闻摘要 - ${date}` : `Daily News Summary - ${date}`,

    prompt: (headlines: string, lang: Language) => `
# Role
You are a news analyst who provides clear, concise summaries of daily news.

# Input Format
You will receive a list of news headlines from the past 24 hours, each formatted as "- headline text".
"""
${headlines}
"""

# Constraints
- Do NOT translate headlines line by line — identify 3-5 most important stories
- Do NOT fabricate facts not present in the headlines
- Focus on stories with widest impact and clearest significance
- Respond in ${lang === 'zh' ? 'Chinese (中文)' : 'English'}

# Output Format (MUST follow)
## [Story 1: Brief Descriptive Title]
**Summary:** 2-3 sentences capturing the key development

## [Story 2: Brief Descriptive Title]
**Summary:** 2-3 sentences capturing the key development

## [Story 3: Brief Descriptive Title]
**Summary:** 2-3 sentences capturing the key development`,
  },

  weekly: {
    title: (date: string, lang: Language) =>
      lang === 'zh' ? `每周趋势观察 - ${date}` : `Weekly Trend Analysis - ${date}`,

    prompt: (headlines: string, lang: Language) => `
# Role
You are a trend forecasting expert specializing in cross-week news analysis.

# Input Format
You will receive a list of news headlines from the past week, each formatted as "- headline text".
"""
${headlines}
"""

# Analysis Objectives
Identify and analyze:
1. **Core Trends (3 major themes)**: The 3 most impactful stories with sustained relevance
2. **Notable Shifts**: Topics that have significantly gained or lost attention vs. previous week
3. **Risk/Opportunity Signals**: Potential developments that may impact the week ahead

# Constraints
- Do NOT fabricate facts not present in the headlines
- If multiple headlines refer to the same event, consolidate them into a single point
- Respond in ${lang === 'zh' ? 'Chinese (中文)' : 'English'}

# Output Format (MUST follow)
## Major Trend 1: [Theme Name]
- [Key point with evidence from headlines]
- [Related development]
- [Potential impact]

## Major Trend 2: [Theme Name]
- [Key point]
- [Related development]

## Notable Shifts
### Gaining Attention
- [Topic + reason based on headlines]

### Losing Attention
- [Topic + reason based on headlines]

## Forward Looking
[A 2-sentence assessment of potential developments next week based on current trends]`,
  },
};

// ============================================================================
// Configuration
// ============================================================================

// Data sufficiency threshold
const MIN_ITEMS_THRESHOLD = 50;

// Max headlines before dedup (to prevent token overflow)
const MAX_HEADLINES_BEFORE_DEDUP = 150;

// Deduplication similarity threshold (Jaccard)
const DEDUP_SIMILARITY_THRESHOLD = 0.6;

// Max headlines after dedup (sent to AI)
const MAX_HEADLINES_TO_AI = 80;

// ============================================================================
// Category Mapping
// ============================================================================

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  tech: ['tech', 'cyber', 'ai', 'science'],
  world: ['defense', 'intl', 'economic', 'political', 'research', 'osint'],
};

// ============================================================================
// Data Retrieval
// ============================================================================

/**
 * Get items by category (now includes pub_date for recency sampling)
 */
async function getItemsByCategory(
  category: ReportCategory,
  hours: number = 24,
  limit: number = MAX_HEADLINES_BEFORE_DEDUP
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

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate category-specific report with enhanced preprocessing
 */
async function generateCategoryReport(
  category: ReportCategory,
  sessionId: string,
  lang: Language = 'zh'
): Promise<Report | null> {
  const hours = category === 'weekly' ? 168 : 24; // 7 days for weekly
  let items = await getItemsByCategory(category, hours);

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
      warn(sessionId, sessionId, `Proceeding with limited data: ${newItems.length} items`);
    }
    items = newItems;
  }

  // Step 1: Deduplicate by Jaccard similarity
  const deduplicated = deduplicateHeadlines(items, DEDUP_SIMILARITY_THRESHOLD);
  info(sessionId, sessionId, `Deduplicated ${items.length} -> ${deduplicated.length} headlines`);

  // Step 2: Sample by recency with max limit
  const sampled = sampleByRecency(deduplicated, MAX_HEADLINES_TO_AI);
  info(sessionId, sessionId, `Sampled ${deduplicated.length} -> ${sampled.length} headlines for AI`);

  // Build headlines string with delimiter for prompt injection prevention
  const headlines = sampled.map(i => `  - ${i.title}`).join('\n');
  const config = REPORT_PROMPTS[category];
  const date = new Date().toISOString().split('T')[0];

  // Generate report with structured prompt
  const summary = await simpleChat(config.prompt(headlines, lang), headlines, {
    temperature: 0.3, // Lower temperature for more consistent factual output
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
  `, [config.title(date, lang), summary, category]);

  info(sessionId, sessionId, `Report created: ${report.rows[0].id} (${category}, ${lang})`);
  return report.rows[0];
}

/**
 * Generate daily summary report (all categories)
 */
export async function generateDailySummary(lang?: Language): Promise<Report[]>;
export async function generateDailySummary(lang: Language, bilingual: true): Promise<{ zh: Report[]; en: Report[] }>;
export async function generateDailySummary(lang?: Language | boolean, bilingual?: boolean): Promise<Report[] | { zh: Report[]; en: Report[] }> {
  // If called with bilingual=true, generate both languages
  if (lang === true || bilingual === true) {
    return generateDailySummaryBilingual();
  }

  const sessionId = `report-daily-${Date.now()}`;
  info(sessionId, sessionId, 'Starting daily report generation');

  const reports: Report[] = [];

  // Generate tech and world reports in parallel
  const [techReport, worldReport] = await Promise.all([
    generateCategoryReport('tech', sessionId, (lang as Language) || 'zh'),
    generateCategoryReport('world', sessionId, (lang as Language) || 'zh'),
  ]);

  if (techReport) reports.push(techReport);
  if (worldReport) reports.push(worldReport);

  info(sessionId, sessionId, `Daily reports generated: ${reports.length}`);
  return reports;
}

/**
 * Generate daily reports in both Chinese and English
 */
async function generateDailySummaryBilingual(): Promise<{ zh: Report[]; en: Report[] }> {
  const sessionId = `report-daily-bilingual-${Date.now()}`;
  info(sessionId, sessionId, 'Starting daily report generation (bilingual)');

  // Generate all reports in parallel
  const [zhTech, zhWorld, enTech, enWorld] = await Promise.all([
    generateCategoryReport('tech', sessionId, 'zh'),
    generateCategoryReport('world', sessionId, 'zh'),
    generateCategoryReport('tech', sessionId, 'en'),
    generateCategoryReport('world', sessionId, 'en'),
  ]);

  const zhReports: Report[] = [];
  const enReports: Report[] = [];

  if (zhTech) zhReports.push(zhTech);
  if (zhWorld) zhReports.push(zhWorld);
  if (enTech) enReports.push(enTech);
  if (enWorld) enReports.push(enWorld);

  info(sessionId, sessionId, `Daily reports generated: zh=${zhReports.length}, en=${enReports.length}`);
  return { zh: zhReports, en: enReports };
}

/**
 * Generate weekly trend analysis report
 */
export async function generateWeeklyTrend(lang: Language = 'zh'): Promise<Report | null> {
  const sessionId = `report-weekly-${Date.now()}`;
  info(sessionId, sessionId, 'Starting weekly trend analysis');

  const report = await generateCategoryReport('weekly', sessionId, lang);

  if (report) {
    info(sessionId, sessionId, `Weekly report created: ${report.id}`);
  }

  return report;
}

/**
 * Generate weekly trend in both languages
 */
export async function generateWeeklyTrendBilingual(): Promise<{ zh: Report | null; en: Report | null }> {
  const sessionId = `report-weekly-bilingual-${Date.now()}`;
  info(sessionId, sessionId, 'Starting weekly trend analysis (bilingual)');

  const [zhReport, enReport] = await Promise.all([
    generateCategoryReport('weekly', sessionId, 'zh'),
    generateCategoryReport('weekly', sessionId, 'en'),
  ]);

  return { zh: zhReport, en: enReport };
}

/**
 * Generate report by category (manual trigger)
 */
export async function generateReport(category: ReportCategory, lang: Language = 'zh'): Promise<Report | null> {
  const sessionId = `report-${category}-${Date.now()}`;
  return generateCategoryReport(category, sessionId, lang);
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
  generateWeeklyTrendBilingual,
  generateReport,
  getRecentReports,
  CATEGORY_MAPPINGS,
  REPORT_PROMPTS,
  MIN_ITEMS_THRESHOLD,
  deduplicateHeadlines,
  sampleByRecency,
  jaccardSimilarity,
};
