/**
 * Translation Service
 * Handles bilingual storage and auto-translation
 * Uses unified AI providers with automatic failover
 */

import { query } from '../database/connection.js';
import { simpleChat, chat } from './ai-providers.js';

export interface TranslationCache {
  id?: number;
  source_text: string;
  target_text: string;
  source_lang: string;
  target_lang: string;
  created_at?: Date;
}

// Batch translation configuration
// Groq llama-3.1-8b-instant: 6000 TPM limit, 8192 context window
// Very conservative: 1 item per batch to avoid 413 Request Too Large errors
const BATCH_SIZE = 1;

export interface NewsItem {
  id: number;
  title: string;
  title_zh?: string | null;
  description?: string;
  description_zh?: string | null;
}

/**
 * Translate text using configured AI provider
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Check cache first
  const cached = await getCachedTranslation(text, sourceLang, targetLang);
  if (cached) {
    return cached;
  }

  try {
    // Use unified AI providers with automatic failover
    // Don't specify model - let each provider use its default (important for fallback)
    const translation = await simpleChat(
      `Translate the following text to ${targetLang}. Only respond with the translation, nothing else.`,
      text,
      { temperature: 0.1 }  // No model specified - providers use defaults
    );

    // Cache the translation
    await cacheTranslation(text, translation, sourceLang, targetLang);

    return translation;
  } catch (error) {
    console.error('[Translation] Error:', error);
    return text; // Return original on error
  }
}

/**
 * Get cached translation
 */
async function getCachedTranslation(
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const result = await query<TranslationCache>(
      `SELECT target_text FROM translation_cache
       WHERE source_text = $1 AND source_lang = $2 AND target_lang = $3
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [sourceText, sourceLang, targetLang]
    );

    return result.rows[0]?.target_text || null;
  } catch {
    return null;
  }
}

/**
 * Cache translation
 */
async function cacheTranslation(
  sourceText: string,
  targetText: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO translation_cache (source_text, target_text, source_lang, target_lang)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [sourceText, targetText, sourceLang, targetLang]
    );
  } catch {
    // Ignore cache errors
  }
}

/**
 * Get batch size (fixed for simplicity)
 */
function getBatchSize(): number {
  return BATCH_SIZE;
}

/**
 * Batch translate multiple texts using LLM
 */
async function batchTranslateLLM(
  items: Array<{ id: number; title: string; description?: string }>,
  targetLang: string
): Promise<Map<number, { title: string; description?: string }>> {
  const results = new Map<number, { title: string; description?: string }>();

  if (items.length === 0) {
    return results;
  }

  // Calculate optimal batch size
  const batchSize = getBatchSize();
  console.log(`[BatchTranslation] Processing ${items.length} items, batch size: ${batchSize}`);

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const startTime = Date.now();

    try {
      const batchResults = await translateBatch(batch, targetLang);

      // Merge results
      batchResults.forEach((translation, id) => {
        results.set(id, translation);
      });

      const elapsed = Date.now() - startTime;
      console.log(`[BatchTranslation] Batch ${Math.floor(i / batchSize) + 1} completed in ${elapsed}ms`);
    } catch (error) {
      console.error(`[BatchTranslation] Batch failed, falling back to individual translation:`, error);

      // Fallback: translate individually
      for (const item of batch) {
        try {
          const title = await translateText(item.title, targetLang);
          let description: string | undefined;
          if (item.description) {
            description = await translateText(item.description, targetLang);
          }
          results.set(item.id, { title, description });
        } catch (individualError) {
          console.error(`[BatchTranslation] Individual translation failed for item ${item.id}:`, individualError);
          // Use original text as fallback
          results.set(item.id, {
            title: item.title,
            description: item.description
          });
        }
      }
    }
  }

  return results;
}

/**
 * Translate a single batch of items
 */
async function translateBatch(
  items: Array<{ id: number; title: string; description?: string }>,
  targetLang: string
): Promise<Map<number, { title: string; description?: string }>> {
  const results = new Map<number, { title: string; description?: string }>();

  // Build structured prompt
  const itemsList = items.map((item, index) => {
    const descPart = item.description ? `, Description: "${item.description}"` : '';
    return `${index + 1}. Title: "${item.title}"${descPart}`;
  }).join('\n');

  const prompt = `Translate the following news titles and descriptions to ${targetLang}.
Return a JSON array with exactly ${items.length} objects, each with "index" (1-based), "title", and "description" fields.

Items to translate:
${itemsList}

Respond with ONLY the JSON array, nothing else. Example format:
[{"index":1,"title":"翻译标题1","description":"翻译描述1"},{"index":2,"title":"翻译标题2","description":"翻译描述2"}]`;

  try {
    const { response } = await chat({
      model: 'default',
      messages: [
        { role: 'system', content: 'You are a translator. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON response
    const parsed = parseTranslationResponse(content, items.length);

    // Map results back to original items by index
    for (const item of items) {
      const index = items.indexOf(item) + 1;
      const translated = parsed.find(p => p.index === index);

      if (translated) {
        results.set(item.id, {
          title: translated.title || item.title,
          description: translated.description || item.description
        });
      } else {
        // Fallback to original if not found
        results.set(item.id, {
          title: item.title,
          description: item.description
        });
      }
    }
  } catch (error) {
    console.error('[BatchTranslation] LLM call failed:', error);
    throw error;
  }

  return results;
}

/**
 * Parse JSON translation response with validation
 */
interface TranslationResult {
  index: number;
  title: string;
  description?: string;
}

function parseTranslationResponse(content: string, expectedCount: number): TranslationResult[] {
  // Try to extract JSON from the response
  let jsonStr = content.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');
  }

  // Try to find JSON array
  const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }

  jsonStr = jsonMatch[0];

  try {
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate and normalize
    const results: TranslationResult[] = [];
    for (const item of parsed) {
      if (item.index !== undefined && item.title !== undefined) {
        results.push({
          index: Number(item.index),
          title: String(item.title),
          description: item.description ? String(item.description) : undefined
        });
      }
    }

    if (results.length === 0) {
      throw new Error('No valid translation results found');
    }

    return results;
  } catch (error) {
    console.error('[BatchTranslation] JSON parse error:', error, 'Content:', content.substring(0, 200));
    throw error;
  }
}

/**
 * Batch translate news items
 */
export async function translateNewsBatch(
  items: Array<{ id: number; title: string; description?: string }>,
  targetLang: string
): Promise<void> {
  const startTime = Date.now();
  let apiCallsBefore = 0;
  let apiCallsAfter = 0;

  // Get provider health to estimate API call reduction
  const health = await import('./ai-providers.js').then(m => m.getProviderHealth());
  console.log(`[BatchTranslation] Starting batch of ${items.length} items`);

  // Step 1: Check cache for all items and filter uncached
  const uncachedItems: Array<{ id: number; title: string; description?: string }> = [];

  for (const item of items) {
    const cachedTitle = await getCachedTranslation(item.title, 'en', targetLang);
    if (cachedTitle) {
      // Title is cached, use cached value
      await query(
        `UPDATE rss_items SET title_zh = $1 WHERE id = $2`,
        [cachedTitle, item.id]
      );

      // Check description cache if exists
      if (item.description) {
        const cachedDesc = await getCachedTranslation(item.description, 'en', targetLang);
        if (cachedDesc) {
          await query(
            `UPDATE rss_items SET description_zh = $1 WHERE id = $2`,
            [cachedDesc, item.id]
          );
        } else {
          uncachedItems.push({ id: item.id, title: item.description, description: undefined });
        }
      }
    } else {
      uncachedItems.push(item);
    }
  }

  console.log(`[BatchTranslation] ${items.length - uncachedItems.length} items cached, ${uncachedItems.length} need translation`);

  // Step 2: Batch translate uncached items
  if (uncachedItems.length > 0) {
    const translations = await batchTranslateLLM(uncachedItems, targetLang);

    // Step 3: Update database and cache
    for (const item of uncachedItems) {
      const translation = translations.get(item.id);
      if (translation) {
        await query(
          `UPDATE rss_items SET title_zh = $1, description_zh = $2 WHERE id = $3`,
          [translation.title, translation.description || null, item.id]
        );

        // Cache the results
        await cacheTranslation(item.title, translation.title, 'en', targetLang);
        if (item.description && translation.description) {
          await cacheTranslation(item.description, translation.description, 'en', targetLang);
        }
      }
    }
  }

  const elapsed = Date.now() - startTime;
  const estimatedOldCalls = items.length * 2;  // title + description per item
  const newCalls = Math.ceil(items.length / BATCH_SIZE);

  console.log(`[BatchTranslation] Completed in ${elapsed}ms`);
  console.log(`[BatchTranslation] API calls: ~${estimatedOldCalls} → ${newCalls} (${Math.round((1 - newCalls / estimatedOldCalls) * 100)}% reduction)`);
}

/**
 * Add translation cache table to schema
 */
export async function ensureTranslationTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS translation_cache (
      id SERIAL PRIMARY KEY,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(source_text, source_lang, target_lang)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup
    ON translation_cache(source_text, source_lang, target_lang)
  `);
}

export default {
  translateText,
  translateNewsBatch,
  ensureTranslationTable,
};
