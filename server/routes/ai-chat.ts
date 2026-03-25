/**
 * AI Chat API Routes
 * POST /api/ai/chat - Chat with AI using automatic failover
 */

import { Router } from 'express';
import { chat, getProviderHealth } from '../services/ai-providers.js';

const router = Router();

/**
 * POST /api/ai/chat
 * Chat completion endpoint
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'messages array is required',
      });
    }

    const result = await chat({
      model: model || 'default',
      messages,
      temperature,
      max_tokens,
    });

    res.json({
      ...result.response,
      provider: result.provider,
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({
      error: 'AI chat failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/providers
 * Get provider health status
 */
router.get('/providers', (req, res) => {
  const health = getProviderHealth();
  res.json({
    providers: health,
    available: health.filter(p => p.healthy).length,
  });
});

export { router };
