/**
 * Country Intelligence Brief Endpoint
 * Generates AI-powered country situation briefs using unified AI providers with automatic failover
 * Redis cached (2h TTL) for cross-user deduplication
 * Requires at least one AI API key and UPSTASH_REDIS environment variables
 */

import express from 'express';
import { getRedis, hashString } from '../utils/upstash.js';
import { simpleChat, getProviderHealth } from '../services/ai-providers.js';

const router = express.Router();

const CACHE_TTL_SECONDS = 7200; // 2 hours
const CACHE_VERSION = 'ci-v4';

router.post('/', async (req, res) => {
  // Check if any AI provider is available
  const providers = getProviderHealth();
  const availableProviders = providers.filter(p => p.healthy);

  if (availableProviders.length === 0) {
    return res.status(503).json({ error: 'No AI providers available. Please configure an API key.', fallback: true });
  }

  try {
    const { country, code, context } = req.body;

    if (!country || !code) {
      return res.status(400).json({ error: 'country and code required' });
    }

    // Cache key includes country code + context hash
    const contextHash = context ? hashString(JSON.stringify(context)).slice(0, 8) : 'no-ctx';
    const cacheKey = `${CACHE_VERSION}:${code}:${contextHash}`;

    const redisClient = getRedis();
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached && typeof cached === 'object' && (cached as any).brief) {
          console.log('[CountryIntel] Cache hit:', code);
          return res.status(200).json({ ...cached as object, cached: true });
        }
      } catch (e: any) {
        console.warn('[CountryIntel] Cache read error:', e.message);
      }
    }

    // Build data context section
    const dataLines = [];
    if (context?.score != null) {
      const changeStr = context.change24h ? ` (${context.change24h > 0 ? '+' : ''}${context.change24h} in 24h)` : '';
      dataLines.push(`Instability Score: ${context.score}/100 (${context.level || 'unknown'}) — trend: ${context.trend || 'unknown'}${changeStr}`);
    }
    if (context?.components) {
      const c = context.components;
      dataLines.push(`Score Components: Unrest ${c.unrest ?? '?'}/100, Security ${c.security ?? '?'}/100, Information ${c.information ?? '?'}/100`);
    }
    if (context?.protests != null) dataLines.push(`Active protests in/near country (7d): ${context.protests}`);
    if (context?.militaryFlights != null) dataLines.push(`Military aircraft detected in/near country: ${context.militaryFlights}`);
    if (context?.militaryVessels != null) dataLines.push(`Military vessels detected in/near country: ${context.militaryVessels}`);
    if (context?.outages != null) dataLines.push(`Internet outages: ${context.outages}`);
    if (context?.earthquakes != null) dataLines.push(`Recent earthquakes: ${context.earthquakes}`);
    if (context?.stockIndex) dataLines.push(`Stock Market Index: ${context.stockIndex}`);
    if (context?.convergenceScore != null) {
      dataLines.push(`Signal convergence score: ${context.convergenceScore}/100 (multiple signal types detected: ${(context.signalTypes || []).join(', ')})`);
    }
    if (context?.regionalConvergence?.length > 0) {
      dataLines.push(`\nRegional convergence alerts:`);
      context.regionalConvergence.forEach((r: string) => dataLines.push(`- ${r}`));
    }
    if (context?.headlines?.length > 0) {
      dataLines.push(`\nRecent headlines mentioning ${country} (${context.headlines.length} found):`);
      context.headlines.slice(0, 15).forEach((h: string, i: number) => dataLines.push(`${i + 1}. ${h}`));
    }

    const dataSection = dataLines.length > 0
      ? `\nCURRENT SENSOR DATA:\n${dataLines.join('\n')}`
      : '\nNo real-time sensor data available for this country.';

    const dateStr = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are a senior intelligence analyst providing comprehensive country situation briefs. Current date: ${dateStr}. Donald Trump is the current US President (second term, inaugurated Jan 2025).

Write a thorough, data-driven intelligence brief for the requested country. Structure:

1. **Current Situation** — What is happening right now. Reference specific data: instability scores, protest counts, military presence, outages. Explain what the numbers mean in context.

2. **Military & Security Posture** — Analyze military activity in/near the country. What forces are present? What does the positioning suggest? What are foreign nations doing in this theater?

3. **Key Risk Factors** — What drives instability or stability. Connect the dots between different signals (protests + outages = potential crackdown? military buildup + diplomatic tensions = escalation risk?). Reference specific headlines.

4. **Regional Context** — How does this country's situation affect or relate to its neighbors and the broader region? Reference any convergence alerts.

5. **Outlook & Watch Items** — What to monitor in the near term. Be specific about indicators that would signal escalation or de-escalation.

Rules:
- Be specific and analytical. Reference the data provided (scores, counts, headlines, convergence).
- If data shows low activity, say so — don't manufacture threats.
- Connect signals: explain what combinations of data points suggest.
- 5-6 paragraphs, 300-400 words.
- No speculation beyond what the data supports.
- Use plain language, not jargon.
- If military assets are 0, don't speculate about military presence — say monitoring shows no current military activity.`;

    const userPrompt = `Country: ${country} (${code})${dataSection}`;

    let brief = '';

    // Use unified AI providers with automatic failover
    try {
      brief = await simpleChat(
        systemPrompt,
        userPrompt,
        { temperature: 0.4, model: 'anthropic/claude-sonnet-4-20250514' }
      );
    } catch (e: any) {
      console.warn('[CountryIntel] AI failed:', e.message);
      return res.status(502).json({ error: 'AI service unavailable', fallback: true });
    }

    if (!brief) {
      return res.status(502).json({ error: 'AI service unavailable', fallback: true });
    }

    const result = {
      brief,
      country,
      code,
      model: 'unified-ai',
      generatedAt: new Date().toISOString(),
    };

    // Cache result
    if (redisClient && brief) {
      try {
        await redisClient.set(cacheKey, result, { ex: CACHE_TTL_SECONDS });
        console.log('[CountryIntel] Cached:', code);
      } catch (e: any) {
        console.warn('[CountryIntel] Cache write error:', e.message);
      }
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[CountryIntel] Error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export { router };
