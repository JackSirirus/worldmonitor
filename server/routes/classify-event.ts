/**
 * Event Classification API
 * Uses unified AI providers with automatic failover to classify news headlines
 * Redis cached (24h TTL)
 */

import express from 'express';
import { getCachedJson, setCachedJson, hashString } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';
import { simpleChat } from '../services/ai-providers.js';

const router = express.Router();

const CACHE_TTL_SECONDS = 86400;
const CACHE_VERSION = 'v1';

const VALID_LEVELS = ['critical', 'high', 'medium', 'low', 'info'];
const VALID_CATEGORIES = [
  'conflict', 'protest', 'disaster', 'diplomatic', 'economic',
  'terrorism', 'cyber', 'health', 'environmental', 'military',
  'crime', 'infrastructure', 'tech', 'general',
];

router.get('/', async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const title = req.query.title as string;
  const variant = (req.query.variant as string) || 'full';

  if (!title) {
    return res.status(400).json({ error: 'title param required' });
  }

  const cacheKey = `classify:${CACHE_VERSION}:${hashString(title.toLowerCase() + ':' + variant)}`;

  try {
    const redisClient = getCachedJson(cacheKey);
    if (redisClient && typeof redisClient === 'object' && (redisClient as any).level) {
      recordCacheTelemetry('/api/classify-event', 'REDIS-HIT');
      return res.status(200).json({
        level: (redisClient as any).level,
        category: (redisClient as any).category,
        confidence: 0.9,
        source: 'llm',
        cached: true,
      });
    }

    const isTech = variant === 'tech';
    const systemPrompt = `You classify news headlines into threat level and category. Return ONLY valid JSON, no other text.

Levels: critical, high, medium, low, info
Categories: conflict, protest, disaster, diplomatic, economic, terrorism, cyber, health, environmental, military, crime, infrastructure, tech, general

${isTech ? 'Focus: technology, startups, AI, cybersecurity. Most tech news is "low" or "info" unless it involves outages, breaches, or major disruptions.' : 'Focus: geopolitical events, conflicts, disasters, diplomacy. Classify by real-world severity and impact.'}

Return: {"level":"...","category":"..."}`;

    const raw = await simpleChat(
      systemPrompt,
      title,
      { temperature: 0, model: 'meta-llama/llama-3.1-8b-instant' }
    );

    if (!raw) {
      return res.status(500).json({ fallback: true });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[Classify] Invalid JSON from LLM:', raw);
      return res.status(500).json({ fallback: true });
    }

    const level = VALID_LEVELS.includes(parsed.level) ? parsed.level : null;
    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : null;
    if (!level || !category) {
      return res.status(500).json({ fallback: true });
    }

    await setCachedJson(cacheKey, { level, category, timestamp: Date.now() }, CACHE_TTL_SECONDS);
    recordCacheTelemetry('/api/classify-event', 'MISS');

    return res.status(200)
      .set({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      })
      .json({
        level,
        category,
        confidence: 0.9,
        source: 'llm',
        cached: false,
      });

  } catch (error: any) {
    console.error('[Classify] Error:', error.message);
    return res.status(500).json({ fallback: true });
  }
});

export { router };
