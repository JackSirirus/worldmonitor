/**
 * News Clustering Service
 * Clusters news items by extracting keywords and finding similar titles
 */

import { query } from '../database/connection.js';

/**
 * Extract keywords from a title for clustering
 */
function extractKeywords(title: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'also', 'now', 'says', 'said', 'new', 'us',
  ]);

  // Extract words, filter and normalize
  const words = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Return unique words
  return [...new Set(words)];
}

/**
 * Calculate Jaccard similarity between two keyword sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Generate cluster ID from keywords
 */
function generateClusterId(keywords: string[]): string {
  // Sort and take top 3 keywords for cluster ID
  const top = [...keywords].sort().slice(0, 3).join('-');
  return `cluster-${top}`;
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
  lat?: number;
  lon?: number;
  keywords: string[];
}

// Source tier mapping (simplified - in real app would come from config)
const SOURCE_TIER: Record<string, number> = {
  'Reuters': 1, 'AP': 1, 'BBC': 1,
  'Reuters World': 1, 'BBC World': 1,
  'Defense One': 2, 'Breaking Defense': 2, 'War Zone': 2,
  'Financial Times': 2, 'Wall Street Journal': 2,
  'CNBC': 3, 'MarketWatch': 3, 'Yahoo Finance': 3,
  'TechCrunch': 3, 'The Verge': 3, 'Wired': 3,
};

function getSourceTier(source: string): number {
  return SOURCE_TIER[source] || 4;
}

/**
 * Calculate velocity metrics for a cluster
 */
function calculateVelocity(allItems: NewsCluster['allItems']): NewsCluster['velocity'] {
  if (allItems.length <= 1) {
    return { sourcesPerHour: 0, level: 'normal', trend: 'stable', sentiment: 'neutral', sentimentScore: 0 };
  }

  const times = allItems.map(i => new Date(i.pubDate).getTime()).sort((a, b) => a - b);
  const timeSpanMs = times[times.length - 1] - times[0];
  const timeSpanHours = Math.max(timeSpanMs / (60 * 60 * 1000), 0.25);
  const sourcesPerHour = allItems.length / timeSpanHours;

  // Determine level
  let level: string = 'normal';
  if (sourcesPerHour >= 6) level = 'spike';
  else if (sourcesPerHour >= 3) level = 'elevated';

  // Determine trend
  const midpoint = times[0] + timeSpanMs / 2;
  const recentItems = allItems.filter(i => new Date(i.pubDate).getTime() > midpoint).length;
  const olderItems = allItems.length - recentItems;
  let trend: string = 'stable';
  if (recentItems > olderItems * 1.5) trend = 'rising';
  else if (olderItems > recentItems * 1.5) trend = 'falling';

  // Simple sentiment from threat levels
  const threatLevels = allItems.filter(i => i.threat?.level).map(i => i.threat!.level);
  const sentimentScore = threatLevels.filter(t => t === 'critical' || t === 'high').length -
    threatLevels.filter(t => t === 'low' || t === 'info').length;
  const sentiment = sentimentScore > 1 ? 'negative' : sentimentScore < -1 ? 'positive' : 'neutral';

  return { sourcesPerHour: Math.round(sourcesPerHour * 10) / 10, level, trend, sentiment, sentimentScore };
}

/**
 * Cluster recent news items
 */
export async function clusterRecentNews(limit: number = 200): Promise<NewsCluster[]> {
  // Fetch recent news items with all needed fields
  const result = await query(`
    SELECT id, title, link, source_url as source, pub_date,
           threat_level, threat_category
    FROM rss_items
    WHERE pub_date > NOW() - INTERVAL '24 hours'
    ORDER BY pub_date DESC
    LIMIT $1
  `, [limit]);

  const items = result.rows;

  // Build keyword sets for each item
  const itemKeywords = items.map(item => ({
    id: item.id,
    title: item.title,
    link: item.link,
    source: item.source,
    pubDate: item.pub_date,
    threat: item.threat_level ? { level: item.threat_level, category: item.threat_category || '' } : undefined,
    keywords: extractKeywords(item.title || ''),
  }));

  // Cluster items
  const clusters: Map<string, NewsCluster> = new Map();
  const itemToCluster: Map<number, string> = new Map();
  const clusterItems: Map<string, typeof itemKeywords> = new Map();

  const SIMILARITY_THRESHOLD = 0.25;

  for (const item of itemKeywords) {
    if (itemToCluster.has(item.id)) continue;

    const itemSet = new Set(item.keywords);

    // Try to find existing cluster with high similarity
    let bestCluster: string | null = null;
    let bestSimilarity = 0;

    for (const [clusterId, cluster] of clusters) {
      const clusterSet = new Set(cluster.keywords);
      const similarity = jaccardSimilarity(itemSet, clusterSet);

      if (similarity >= SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = clusterId;
      }
    }

    if (bestCluster) {
      // Add to existing cluster
      const cluster = clusters.get(bestCluster)!;
      cluster.sourceCount++;
      if (item.keywords.length > cluster.keywords.length) {
        cluster.keywords = item.keywords.slice(0, 10);
      }
      itemToCluster.set(item.id, bestCluster);
      clusterItems.get(bestCluster)!.push(item);
    } else {
      // Create new cluster
      const clusterId = generateClusterId(item.keywords.slice(0, 3));
      clusters.set(clusterId, {
        id: clusterId,
        primaryTitle: item.title,
        primaryLink: item.link || '',
        primarySource: item.source,
        sourceCount: 1,
        topSources: [{ name: item.source, tier: getSourceTier(item.source), url: item.link || '' }],
        allItems: [{
          source: item.source,
          title: item.title,
          link: item.link || '',
          pubDate: item.pubDate?.toISOString() || new Date().toISOString(),
          isAlert: item.threat?.level === 'critical' || item.threat?.level === 'high',
          threat: item.threat,
        }],
        firstSeen: item.pubDate?.toISOString() || new Date().toISOString(),
        lastUpdated: item.pubDate?.toISOString() || new Date().toISOString(),
        isAlert: item.threat?.level === 'critical' || item.threat?.level === 'high',
        threat: item.threat,
        keywords: item.keywords.slice(0, 10),
      });
      itemToCluster.set(item.id, clusterId);
      clusterItems.set(clusterId, [item]);
    }
  }

  // Enrich clusters with additional data
  for (const [clusterId, cluster] of clusters) {
    const itemsInCluster = clusterItems.get(clusterId) || [];

    // Build top sources
    const sourceMap = new Map<string, { name: string; tier: number; url: string; count: number }>();
    for (const item of itemsInCluster) {
      const existing = sourceMap.get(item.source);
      if (existing) {
        existing.count++;
      } else {
        sourceMap.set(item.source, { name: item.source, tier: getSourceTier(item.source), url: item.link || '', count: 1 });
      }
    }
    cluster.topSources = Array.from(sourceMap.values())
      .sort((a, b) => a.tier - b.tier)
      .slice(0, 5)
      .map(s => ({ name: s.name, tier: s.tier, url: s.url }));

    // Update allItems
    cluster.allItems = itemsInCluster.map(item => ({
      source: item.source,
      title: item.title,
      link: item.link || '',
      pubDate: item.pubDate?.toISOString() || new Date().toISOString(),
      isAlert: item.threat?.level === 'critical' || item.threat?.level === 'high',
      threat: item.threat,
    }));

    // Calculate first/last seen
    const times = itemsInCluster.map(i => i.pubDate?.getTime() || 0).filter(t => t > 0).sort((a, b) => a - b);
    if (times.length > 0) {
      cluster.firstSeen = new Date(times[0]).toISOString();
      cluster.lastUpdated = new Date(times[times.length - 1]).toISOString();
    }

    // Calculate velocity
    cluster.velocity = calculateVelocity(cluster.allItems);

    // Set monitor color based on threat level
    if (itemsInCluster.some(i => i.threat?.level === 'critical')) {
      cluster.monitorColor = '#ef4444';
    } else if (itemsInCluster.some(i => i.threat?.level === 'high')) {
      cluster.monitorColor = '#f97316';
    } else if (itemsInCluster.some(i => i.threat?.level === 'medium')) {
      cluster.monitorColor = '#eab308';
    } else {
      cluster.monitorColor = '#22c55e';
    }
  }

  // Update cluster_ids in database
  for (const [itemId, clusterId] of itemToCluster) {
    await query(`
      UPDATE rss_items SET cluster_id = $1 WHERE id = $2
    `, [clusterId, itemId]);
  }

  // Return sorted clusters
  return Array.from(clusters.values())
    .sort((a, b) => b.sourceCount - a.sourceCount);
}

/**
 * Get clusters from database
 * Returns full cluster data including allItems, velocity, etc.
 */
export async function getClusters(minItems: number = 2): Promise<NewsCluster[]> {
  // First, run clustering to populate cluster_ids
  return await clusterRecentNews(200);
}

export default {
  clusterRecentNews,
  getClusters,
};
