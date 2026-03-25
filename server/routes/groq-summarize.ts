/**
 * AI Summarization Endpoint with Redis Caching
 * Uses unified AI providers with automatic failover
 * Redis cached (24h TTL)
 * Requires at least one AI API key (GROQ_API_KEY, OPENROUTER_API_KEY, MINIMAX_API_KEY, etc.) and UPSTASH_REDIS
 */

import express from 'express';
import { getRedis, hashString } from '../utils/upstash.js';
import { simpleChat, getProviderHealth } from '../services/ai-providers.js';

const router = express.Router();

const CACHE_TTL_SECONDS = 86400; // 24 hours
const CACHE_VERSION = 'v4';

function getCacheKey(headlines: string[], mode: string, geoContext = '', variant = 'full') {
  const sorted = headlines.slice(0, 8).sort().join('|');
  const geoHash = geoContext ? ':g' + hashString(geoContext).slice(0, 6) : '';
  const hash = hashString(`${mode}:${sorted}`);
  return `summary:${CACHE_VERSION}:${variant}:${hash}${geoHash}`;
}

function deduplicateHeadlines(headlines: string[]) {
  const seen = new Set<Set<string>>();
  const unique: string[] = [];

  for (const headline of headlines) {
    const normalized = headline.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const words = new Set(normalized.split(' ').filter(w => w.length >= 4));

    let isDuplicate = false;
    for (const seenWords of seen) {
      const intersection = [...words].filter(w => seenWords.has(w));
      const similarity = intersection.length / Math.min(words.size, seenWords.size);
      if (similarity > 0.6) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(words);
      unique.push(headline);
    }
  }

  return unique;
}

router.post('/', async (req, res) => {
  // Check if any AI provider is available
  const providers = getProviderHealth();
  const availableProviders = providers.filter(p => p.healthy);

  if (availableProviders.length === 0) {
    return res.status(503).json({ error: 'No AI providers available. Please configure an API key.', fallback: true });
  }

  try {
    const { headlines, mode = 'brief', geoContext = '', variant = 'full' } = req.body;

    if (!headlines || !Array.isArray(headlines) || headlines.length === 0) {
      return res.status(400).json({ error: 'Headlines array required' });
    }

    const redisClient = getRedis();
    const cacheKey = getCacheKey(headlines, mode, geoContext, variant);

    // Check cache first
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey) as any;
        if (cached && typeof cached === 'object' && cached.summary) {
          console.log('[Summarize] Cache hit:', cacheKey);
          return res.status(200).json({
            summary: cached.summary,
            model: cached.model || 'unified-ai',
            provider: 'cache',
            cached: true,
          });
        }
      } catch (cacheError: any) {
        console.warn('[Summarize] Cache read error:', cacheError.message);
      }
    }

    // Deduplicate headlines
    const uniqueHeadlines = deduplicateHeadlines(headlines.slice(0, 8));
    const headlineText = uniqueHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

    let systemPrompt, userPrompt;
    const intelSection = geoContext ? `\n\n${geoContext}` : '';
    const isTechVariant = variant === 'tech';
    const dateContext = `Current date: ${new Date().toISOString().split('T')[0]}.${isTechVariant ? '' : ' Donald Trump is the current US President (second term, inaugurated Jan 2025).'}`;

    if (mode === 'brief') {
      if (isTechVariant) {
        systemPrompt = `${dateContext}

Summarize the key tech/startup development in 2-3 sentences.
Rules:
- Focus ONLY on technology, startups, AI, funding, product launches, or developer news
- IGNORE political news, trade policy, tariffs, government actions unless directly about tech regulation
- Lead with the company/product/technology name
- Start directly: "OpenAI announced...", "A new $50M Series B...", "GitHub released..."
- No bullet points, no meta-commentary`;
      } else {
        systemPrompt = `${dateContext}

Summarize the key development in 2-3 sentences.
Rules:
- Lead with WHAT happened and WHERE - be specific
- NEVER start with "Breaking news", "Good evening", "Tonight", or TV-style openings
- Start directly with the subject: "Iran's regime...", "The US Treasury...", "Protests in..."
- CRITICAL FOCAL POINTS are the main actors - mention them by name
- If focal points show news + signals convergence, that's the lead
- No bullet points, no meta-commentary`;
      }
      userPrompt = `Summarize the top story:\n${headlineText}${intelSection}`;
    } else if (mode === 'analysis') {
      if (isTechVariant) {
        systemPrompt = `${dateContext}

Analyze the tech/startup trend in 2-3 sentences.
Rules:
- Focus ONLY on technology implications: funding trends, AI developments, market shifts, product strategy
- IGNORE political implications, trade wars, government unless directly about tech policy
- Lead with the insight for tech industry
- Connect to startup ecosystem, VC trends, or technical implications`;
      } else {
        systemPrompt = `${dateContext}

Provide analysis in 2-3 sentences. Be direct and specific.
Rules:
- Lead with the insight - what's significant and why
- NEVER start with "Breaking news", "Tonight", "The key/dominant narrative is"
- Start with substance: "Iran faces...", "The escalation in...", "Multiple signals suggest..."
- CRITICAL FOCAL POINTS are your main actors - explain WHY they matter
- If focal points show news-signal correlation, flag as escalation
- Connect dots, be specific about implications`;
      }
      userPrompt = isTechVariant
        ? `What's the key tech trend or development?\n${headlineText}${intelSection}`
        : `What's the key pattern or risk?\n${headlineText}${intelSection}`;
    } else {
      systemPrompt = isTechVariant
        ? `${dateContext}\n\nSynthesize tech news in 2 sentences. Focus on startups, AI, funding, products. Ignore politics unless directly about tech regulation.`
        : `${dateContext}\n\nSynthesize in 2 sentences max. Lead with substance. NEVER start with "Breaking news" or "Tonight" - just state the insight directly. CRITICAL focal points with news-signal convergence are significant.`;
      userPrompt = `Key takeaway:\n${headlineText}${intelSection}`;
    }

    // Use unified AI providers with automatic failover
    const summary = await simpleChat(
      systemPrompt,
      userPrompt,
      { temperature: 0.3, model: 'meta-llama/llama-3.1-8b-instant', max_tokens: 150 }
    );

    if (!summary) {
      return res.status(500).json({ error: 'Empty response', fallback: true });
    }

    // Cache result
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, { summary, model: 'unified-ai', timestamp: Date.now() }, { ex: CACHE_TTL_SECONDS });
        console.log('[Summarize] Cached:', cacheKey);
      } catch (cacheError: any) {
        console.warn('[Summarize] Cache write error:', cacheError.message);
      }
    }

    return res.status(200)
      .set({ 'Cache-Control': 'public, max-age=1800' })
      .json({
        summary,
        model: 'unified-ai',
        provider: availableProviders[0]?.name || 'ai',
        cached: false,
      });

  } catch (error: any) {
    console.error('[Summarize] Error:', error.message);
    return res.status(500).json({ error: error.message, errorType: error.name, fallback: true });
  }
});

export { router };
