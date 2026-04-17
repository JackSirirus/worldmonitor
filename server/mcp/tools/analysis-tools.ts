/**
 * Analysis Tools for MCP Server
 * Phase 2: AI-powered analysis tools
 */

import { getNews } from '../../repositories/news.js';
import { simpleChat } from '../../services/ai-providers.js';
import type { MCPToolResult } from '../types.js';

/**
 * Tool: analyze_trends
 * AI analysis of specific topic trends
 */
export async function analyzeTrends(args: {
  topic: string;
  period?: string;
}): Promise<MCPToolResult> {
  try {
    if (!args.topic) {
      return {
        success: false,
        error: 'Topic is required',
      };
    }

    // Determine time period
    const periodHours = parsePeriod(args.period || '7d');
    const fromDate = new Date(Date.now() - periodHours * 60 * 60 * 1000);

    // Fetch news for the topic with date filter
    const result = await getNews(
      { search: args.topic, fromDate },
      { page: 1, limit: 50 }
    );

    // Items are already filtered by date at database level
    const items = result.items;

    if (items.length === 0) {
      return {
        success: true,
        data: {
          topic: args.topic,
          period: args.period || '7d',
          analysis: `No recent news found for "${args.topic}" in the specified time period.`,
          itemCount: 0,
        },
      };
    }

    // Format headlines for AI analysis
    const headlines = items
      .slice(0, 30)
      .map(item => `- ${item.title}`)
      .join('\n');

    // AI prompt for trend analysis
    const systemPrompt = `You are a geopolitical and financial news analyst.
Analyze the provided news headlines and identify:
1. Key themes and patterns
2. Overall sentiment and tone
3. Potential implications
4. Emerging or fading trends

Provide a concise but insightful analysis.`;

    const userMessage = `Analyze these recent news headlines about "${args.topic}":

${headlines}

Focus on identifying:
- Main themes and storylines
- Sentiment (positive/negative/neutral)
- Key actors involved
- Potential implications
- How this compares to typical coverage`;

    const analysis = await simpleChat(systemPrompt, userMessage, {
      temperature: 0.5,
    });

    return {
      success: true,
      data: {
        topic: args.topic,
        period: args.period || '7d',
        itemCount: items.length,
        analysis,
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
 * Tool: get_sentiment_breakdown
 * Get sentiment distribution statistics
 */
export async function getSentimentBreakdown(args: {
  category?: string;
  period?: string;
}): Promise<MCPToolResult> {
  try {
    const periodHours = parsePeriod(args.period || '24h');

    // Use fetched_at for accurate time filtering (when we collected the data)
    const { query } = await import('../../database/connection.js');

    let sql = `
      SELECT sentiment_label, sentiment_score
      FROM rss_items
      WHERE fetched_at > NOW() - INTERVAL '${periodHours} hours'
    `;
    const params: string[] = [];

    if (args.category) {
      sql += ' AND category = $1';
      params.push(args.category);
    }

    sql += ' LIMIT 500';

    const result = await query<{ sentiment_label: string | null; sentiment_score: number | null }>(sql, params);

    const items = result.rows;

    // Calculate sentiment distribution
    const distribution = {
      positive: { count: 0, percentage: 0 },
      negative: { count: 0, percentage: 0 },
      neutral: { count: 0, percentage: 0 },
    };

    for (const item of items) {
      const label = item.sentiment_label || 'neutral';
      if (label === 'positive') {
        distribution.positive.count++;
      } else if (label === 'negative') {
        distribution.negative.count++;
      } else {
        distribution.neutral.count++;
      }
    }

    const total = items.length || 1;
    distribution.positive.percentage = Math.round((distribution.positive.count / total) * 100);
    distribution.negative.percentage = Math.round((distribution.negative.count / total) * 100);
    distribution.neutral.percentage = Math.round((distribution.neutral.count / total) * 100);

    // Calculate average sentiment score
    const avgScore = items.length > 0
      ? items.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / items.length
      : 0;

    return {
      success: true,
      data: {
        period: args.period || '24h',
        category: args.category || 'all',
        totalItems: items.length,
        distribution,
        averageScore: Math.round(avgScore * 100) / 100,
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
 * Tool: compare_periods
 * Compare news between different time periods
 */
export async function comparePeriods(args: {
  period1: string;
  period2: string;
  category?: string;
}): Promise<MCPToolResult> {
  try {
    if (!args.period1 || !args.period2) {
      return {
        success: false,
        error: 'Both period1 and period2 are required',
      };
    }

    const hours1 = parsePeriod(args.period1);
    const hours2 = parsePeriod(args.period2);

    const filters: Parameters<typeof getNews>[0] = {};
    if (args.category) {
      filters.category = args.category;
    }

    // Get news for both periods
    const result1 = await getNews(filters, { page: 1, limit: 100 });
    const result2 = await getNews(filters, { page: 1, limit: 100 });

    const now = new Date();

    // Filter period 1
    const period1Items = result1.items.filter(item => {
      if (!item.pub_date) return false;
      const itemDate = new Date(item.pub_date);
      const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= hours1;
    });

    // Filter period 2 (older)
    const period2Items = result2.items.filter(item => {
      if (!item.pub_date) return false;
      const itemDate = new Date(item.pub_date);
      const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff > hours1 && hoursDiff <= hours1 + hours2;
    });

    // Get top sources for each period
    const sources1 = getTopSources(period1Items, 5);
    const sources2 = getTopSources(period2Items, 5);

    // Get categories for each period
    const categories1 = getCategoryDistribution(period1Items);
    const categories2 = getCategoryDistribution(period2Items);

    // Calculate sentiment comparison
    const sentiment1 = calculateAverageSentiment(period1Items);
    const sentiment2 = calculateAverageSentiment(period2Items);

    // AI-powered comparison
    let aiComparison = '';
    if (period1Items.length > 0 && period2Items.length > 0) {
      const headlines1 = period1Items.slice(0, 10).map(i => `- ${i.title}`).join('\n');
      const headlines2 = period2Items.slice(0, 10).map(i => `- ${i.title}`).join('\n');

      const comparisonPrompt = `Compare these two sets of news headlines from different time periods:

RECENT PERIOD (${args.period1}):
${headlines1}

EARLIER PERIOD (${args.period2}):
${headlines2}

Provide a brief analysis of:
- How the news volume changed
- Shifts in topics or themes
- Changes in sentiment
- Emerging stories in the recent period`;

      aiComparison = await simpleChat(
        'You are a news analyst specializing in trend comparison.',
        comparisonPrompt,
        { temperature: 0.3 }
      );
    }

    return {
      success: true,
      data: {
        period1: {
          period: args.period1,
          itemCount: period1Items.length,
          topSources: sources1,
          categories: categories1,
          averageSentiment: sentiment1,
        },
        period2: {
          period: args.period2,
          itemCount: period2Items.length,
          topSources: sources2,
          categories: categories2,
          averageSentiment: sentiment2,
        },
        volumeChange: period1Items.length - period2Items.length,
        aiComparison,
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
 * Tool: get_threat_overview
 * Get threat level overview
 */
export async function getThreatOverview(): Promise<MCPToolResult> {
  try {
    // Use fetched_at for accurate "last 24 hours of collected data"
    const { query } = await import('../../database/connection.js');

    const result = await query<{
      id: number;
      title: string;
      source_url: string;
      pub_date: Date | null;
      threat_level: string | null;
      threat_category: string | null;
    }>(
      `SELECT id, title, source_url, pub_date, threat_level, threat_category
       FROM rss_items
       WHERE fetched_at > NOW() - INTERVAL '24 hours'
       ORDER BY fetched_at DESC
       LIMIT 200`
    );

    // Use fetched_at-based filtering since that's what we query by
    const items = result.rows;

    // Count by threat level
    const threatLevels = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      unknown: 0,
    };

    // Count by threat category
    const threatCategories: Record<string, number> = {};

    for (const item of items) {
      const level = item.threat_level || 'unknown';
      if (level in threatLevels) {
        (threatLevels as any)[level]++;
      } else {
        threatLevels.unknown++;
      }

      const category = item.threat_category || 'general';
      threatCategories[category] = (threatCategories[category] || 0) + 1;
    }

    // Identify top threats (items with critical or high threat)
    const topThreats = items
      .filter(item => item.threat_level === 'critical' || item.threat_level === 'high')
      .slice(0, 10)
      .map(item => ({
        title: item.title,
        level: item.threat_level,
        category: item.threat_category,
        source: item.source_url,
        pubDate: item.pub_date,
      }));

    // Calculate overall threat score (0-100)
    const threatScore = calculateThreatScore(threatLevels);

    return {
      success: true,
      data: {
        period: '24h',
        totalItems: items.length,
        threatLevels,
        threatCategories: Object.entries(threatCategories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .reduce((acc, [cat, count]) => ({ ...acc, [cat]: count }), {}),
        threatScore,
        threatLevel: getThreatLevelLabel(threatScore),
        topThreats,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper functions

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([hdw])$/);
  if (!match) return 24; // Default 24 hours

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'h': return value;
    case 'd': return value * 24;
    case 'w': return value * 24 * 7;
    default: return 24;
  }
}

function getTopSources(items: any[], limit: number): Array<{ source: string; count: number }> {
  const sourceCount: Record<string, number> = {};
  for (const item of items) {
    const source = (item as any).source || item.source_url || 'unknown';
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  }
  return Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([source, count]) => ({ source, count }));
}

function getCategoryDistribution(items: any[]): Record<string, number> {
  const categories: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || 'uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  return categories;
}

function calculateAverageSentiment(items: any[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + (item.sentiment_score || 0), 0);
  return Math.round((sum / items.length) * 100) / 100;
}

function calculateThreatScore(threatLevels: Record<string, number>): number {
  const weights: Record<string, number> = {
    critical: 40,
    high: 25,
    medium: 15,
    low: 5,
    info: 0,
    unknown: 0,
  };

  const total = Object.values(threatLevels).reduce((a, b) => a + b, 0) || 1;
  let score = 0;

  for (const [level, count] of Object.entries(threatLevels)) {
    score += (weights[level] || 0) * count;
  }

  return Math.round(score / total);
}

function getThreatLevelLabel(score: number): string {
  if (score >= 30) return 'HIGH';
  if (score >= 15) return 'MEDIUM';
  if (score >= 5) return 'LOW';
  return 'MINIMAL';
}
