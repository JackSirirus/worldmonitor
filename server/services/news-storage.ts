/**
 * News Storage Service
 * Handles deduplication, clustering, and translation
 */

import crypto from 'crypto';
import { getNewsByLink, insertNews, batchInsertNews, getNewsById } from '../repositories/news.js';

export interface ProcessedNews {
  id?: number;
  source_url: string;
  title: string;
  link: string;
  description?: string;
  pub_date?: Date;
  category?: string;
  title_hash?: string;
  title_tokens?: string[];
  cluster_id?: string;
}

/**
 * Generate MD5 hash of title for deduplication
 */
export function generateTitleHash(title: string): string {
  return crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex');
}

/**
 * Tokenize title for Jaccard similarity
 */
export function tokenize(text: string): string[] {
  // Remove common punctuation and split into words
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
    'their', 'we', 'our', 'you', 'your', 'he', 'she', 'him', 'her',
    'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'also', 'now', 'new', 'update',
  ]);

  return cleaned.split(' ').filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate Jaccard similarity between two token arrays
 */
export function calculateJaccard(tokens1: string[], tokens2: string[], threshold: number = 0.5): boolean {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  const similarity = jaccardSimilarity(set1, set2);
  return similarity >= threshold;
}

/**
 * Check if news item is duplicate using MD5 hash
 */
export async function isDuplicate(title: string, link: string): Promise<boolean> {
  // First check by link (unique constraint)
  const existingByLink = await getNewsByLink(link);
  if (existingByLink) {
    return true;
  }

  // Then check by title hash
  const titleHash = generateTitleHash(title);
  return false; // For now, we rely on link uniqueness
}

/**
 * Process and insert news items with deduplication
 */
export async function processAndInsertNews(
  items: Array<{
    source_url: string;
    title: string;
    link: string;
    description?: string;
    pub_date?: Date;
    category?: string;
  }>
): Promise<{ inserted: number; duplicates: number; errors: number }> {
  const toInsert: ProcessedNews[] = [];
  let duplicates = 0;
  let errors = 0;

  for (const item of items) {
    try {
      // Check for duplicates
      const isDup = await isDuplicate(item.title, item.link);
      if (isDup) {
        duplicates++;
        continue;
      }

      // Process the item
      const processed: ProcessedNews = {
        source_url: item.source_url,
        title: item.title,
        link: item.link,
        description: item.description,
        pub_date: item.pub_date,
        category: item.category,
        title_hash: generateTitleHash(item.title),
        title_tokens: tokenize(item.title),
      };

      toInsert.push(processed);
    } catch (err) {
      console.error('[News Storage] Error processing item:', err);
      errors++;
    }
  }

  // Batch insert
  if (toInsert.length > 0) {
    await batchInsertNews(toInsert);
  }

  return {
    inserted: toInsert.length,
    duplicates,
    errors,
  };
}

/**
 * Assign cluster ID to similar news items
 */
export function assignCluster(newsItems: ProcessedNews[], threshold: number = 0.5): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  let clusterCounter = 0;

  for (let i = 0; i < newsItems.length; i++) {
    const item = newsItems[i];
    if (!item.title_tokens || item.title_tokens.length === 0) continue;

    let assigned = false;

    // Check existing clusters
    for (const [clusterId, clusterItems] of clusters.entries()) {
      const lastItem = newsItems.find(n => n.link === clusterItems[clusterItems.length - 1]);
      if (lastItem && lastItem.title_tokens) {
        if (calculateJaccard(item.title_tokens!, lastItem.title_tokens, threshold)) {
          clusterItems.push(item.link);
          item.cluster_id = clusterId;
          assigned = true;
          break;
        }
      }
    }

    // Create new cluster if not assigned
    if (!assigned) {
      const clusterId = `cluster-${++clusterCounter}`;
      clusters.set(clusterId, [item.link]);
      item.cluster_id = clusterId;
    }
  }

  return clusters;
}

export default {
  generateTitleHash,
  tokenize,
  jaccardSimilarity,
  calculateJaccard,
  isDuplicate,
  processAndInsertNews,
  assignCluster,
};
