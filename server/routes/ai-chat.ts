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
 *
 * Accepts both formats:
 * 1. { messages: [{role, content}], ... } - standard format
 * 2. { message: "text", context?: {...} } - simple single message format
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, message, context, model, temperature, max_tokens } = req.body;

    let chatMessages: { role: 'user' | 'assistant' | 'system'; content: string }[];

    if (messages && Array.isArray(messages)) {
      // Standard format: messages array
      chatMessages = messages;
    } else if (message && typeof message === 'string') {
      // Simple format: single message string with optional context
      chatMessages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Either messages array or message string is required',
      });
    }

    const result = await chat({
      model: model || 'default',
      messages: chatMessages,
      temperature,
      max_tokens,
    });

    res.json({
      response: result.response.choices[0]?.message?.content || 'No response',
      provider: result.provider,
      ...result.response,
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
