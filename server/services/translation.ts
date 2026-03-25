/**
 * Translation Service
 * Handles bilingual storage and auto-translation
 * Uses unified AI providers with automatic failover
 */

import { query } from '../database/connection.js';
import { simpleChat, getProviderHealth } from './ai-providers.js';

export interface TranslationCache {
  id?: number;
  source_text: string;
  target_text: string;
  source_lang: string;
  target_lang: string;
  created_at?: Date;
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
    const translation = await simpleChat(
      `Translate the following text to ${targetLang}. Only respond with the translation, nothing else.`,
      text,
      { temperature: 0.1, model: 'meta-llama/llama-3.1-8b-instant' }
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
 * Batch translate news items
 */
export async function translateNewsBatch(
  items: Array<{ id: number; title: string; description?: string }>,
  targetLang: string
): Promise<void> {
  for (const item of items) {
    try {
      // Translate title
      const translatedTitle = await translateText(item.title, targetLang);

      // Translate description if exists
      let translatedDesc = null;
      if (item.description) {
        translatedDesc = await translateText(item.description, targetLang);
      }

      // Update database
      await query(
        `UPDATE rss_items
         SET title_zh = $1, description_zh = $2
         WHERE id = $3`,
        [translatedTitle, translatedDesc, item.id]
      );
    } catch (error) {
      console.error(`[Translation] Failed to translate item ${item.id}:`, error);
    }
  }
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
