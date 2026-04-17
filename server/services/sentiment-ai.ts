/**
 * AI Sentiment Analysis Service
 * Uses Groq/LLM for enhanced sentiment analysis with Redis caching
 *
 * Enable via USE_AI_SENTIMENT=true environment variable
 * Falls back to keyword-based analysis for obvious cases or when AI fails
 */

import { simpleChat } from './ai-providers.js';
import { analyzeSentiment as keywordAnalyze, type SentimentResult } from './sentiment-analysis.js';
import { getRedis, hashString, getCachedJson, setCachedJson } from '../utils/upstash.js';

const CACHE_TTL_SECONDS = 86400; // 24 hours
const CACHE_PREFIX = 'sentiment:ai:v1';

// Ambiguity threshold - if keyword score is near 0, use AI
const AMBIGUITY_THRESHOLD = 1.5;

/**
 * System prompt for AI sentiment analysis
 */
const SYSTEM_PROMPT = `You are a financial and geopolitical news sentiment analyzer.
Analyze the headline and determine its sentiment.

Return a JSON object with:
- "sentiment": one of "negative", "neutral", or "positive"
- "score": a number from -1.0 (very negative) to 1.0 (very positive)
- "reasoning": brief explanation of your analysis

For headlines:
- Negative: war, conflict, sanctions, crisis, attack, death, crash, failure, recession, tension
- Positive: peace, deal, agreement, growth, success, breakthrough, recovery, rally

Be conservative with extreme scores (-1.0 or 1.0) - most headlines are mildly to moderately positive or negative.`;

/**
 * Quick check if a headline is obviously positive or negative (no AI needed)
 */
function isObviousSentiment(text: string): 'positive' | 'negative' | null {
  const lower = text.toLowerCase();

  // Obvious negative indicators (strong)
  const strongNegative = [
    'war', 'invasion', 'attack', 'killed', 'death', 'dead', 'casualties',
    'nuclear war', 'world war', 'massacre', 'genocide', 'terrorism',
    'pandemic', 'plague', 'famine',
  ];

  // Obvious positive indicators (strong)
  const strongPositive = [
    'peace treaty', 'ceasefire', 'breakthrough', 'peace agreement',
    'vaccine approved', 'cure discovered', 'peace deal',
  ];

  for (const phrase of strongNegative) {
    if (lower.includes(phrase)) return 'negative';
  }

  for (const phrase of strongPositive) {
    if (lower.includes(phrase)) return 'positive';
  }

  return null;
}

/**
 * Get cache key for a headline
 */
function getCacheKey(headline: string): string {
  const hash = hashString(headline);
  return `${CACHE_PREFIX}:${hash}`;
}

/**
 * Analyze sentiment using AI (Groq/LLM)
 */
async function analyzeWithAI(text: string): Promise<SentimentResult> {
  const userMessage = `Analyze this headline:\n"${text}"`;

  const response = await simpleChat(SYSTEM_PROMPT, userMessage, {
    temperature: 0.3,
  });

  // Parse JSON response
  try {
    // Try to extract JSON from response (may have surrounding text)
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || 'neutral',
        score: Math.max(-1, Math.min(1, parsed.score || 0)),
      };
    }
  } catch (parseError) {
    console.warn('[SentimentAI] Parse error:', parseError);
  }

  // Fallback if parsing fails
  return { sentiment: 'neutral', score: 0 };
}

/**
 * Main entry point: Analyze sentiment with AI enhancement
 *
 * Strategy:
 * 1. Check Redis cache
 * 2. Use keyword fallback for obvious cases (strong signals)
 * 3. Use AI for ambiguous cases (score near 0)
 * 4. Cache result
 */
export async function analyzeSentimentAI(text: string): Promise<SentimentResult> {
  // Check for empty text
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', score: 0 };
  }

  const cacheKey = getCacheKey(text);

  // Step 1: Check Redis cache
  try {
    const redis = getRedis();
    if (redis) {
      const cached = await getCachedJson(cacheKey) as SentimentResult | null;
      if (cached && typeof cached.sentiment === 'string') {
        return cached;
      }
    }
  } catch (cacheError) {
    console.warn('[SentimentAI] Cache read error:', cacheError);
  }

  // Step 2: Check for obvious sentiment (no AI needed)
  const obviousSentiment = isObviousSentiment(text);
  if (obviousSentiment) {
    const keywordResult = keywordAnalyze(text);
    // Override only if keyword agrees with obvious check
    if ((obviousSentiment === 'negative' && keywordResult.score < 0) ||
        (obviousSentiment === 'positive' && keywordResult.score > 0)) {
      // Cache the result
      await setCachedJson(cacheKey, keywordResult, CACHE_TTL_SECONDS);
      return keywordResult;
    }
  }

  // Step 3: Use keyword analysis to determine if AI is needed
  const keywordResult = keywordAnalyze(text);

  // If score is clear (strong signal), use keyword result
  if (Math.abs(keywordResult.score) >= AMBIGUITY_THRESHOLD) {
    await setCachedJson(cacheKey, keywordResult, CACHE_TTL_SECONDS);
    return keywordResult;
  }

  // Step 4: Score is ambiguous, use AI
  try {
    const aiResult = await analyzeWithAI(text);

    // Combine keyword and AI results (weighted average)
    // Give more weight to AI for ambiguous cases
    const combinedScore = (keywordResult.score * 0.3 + aiResult.score * 0.7);

    const result: SentimentResult = {
      sentiment: combinedScore < -0.3 ? 'negative' : combinedScore > 0.3 ? 'positive' : 'neutral',
      score: Math.round(combinedScore * 100) / 100,
    };

    // Cache the combined result
    await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);

    return result;
  } catch (aiError) {
    console.warn('[SentimentAI] AI analysis failed, using keyword fallback:', aiError);

    // Fallback to keyword analysis on AI failure
    await setCachedJson(cacheKey, keywordResult, CACHE_TTL_SECONDS);
    return keywordResult;
  }
}

/**
 * Batch analyze sentiment for multiple texts
 * Processes in parallel with rate limiting
 */
export async function analyzeSentimentBatch(
  texts: string[],
  options?: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<SentimentResult[]> {
  const concurrency = options?.concurrency || 5;
  const results: SentimentResult[] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(text => analyzeSentimentAI(text))
    );

    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }

    if (options?.onProgress) {
      options.onProgress(Math.min(i + concurrency, texts.length), texts.length);
    }
  }

  return results;
}

/**
 * Check if AI sentiment analysis is enabled
 */
export function isAISentimentEnabled(): boolean {
  return process.env.USE_AI_SENTIMENT === 'true';
}

export default {
  analyzeSentimentAI,
  analyzeSentimentBatch,
  isAISentimentEnabled,
};
