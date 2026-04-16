/**
 * AI Chat API Routes
 * POST /api/ai/chat - Chat with AI using automatic failover with news RAG
 */

import { Router } from 'express';
import { chat, getProviderHealth } from '../services/ai-providers.js';
import { getNews, type NewsItem } from '../repositories/news.js';

const router = Router();

// RAG configuration
const NEWS_SEARCH_LIMIT = 10;
const NEWS_SEARCH_DAYS = 7;

/**
 * Search for relevant news based on user query
 */
async function searchNewsForChat(query: string): Promise<NewsItem[]> {
  try {
    const fromDate = new Date(Date.now() - NEWS_SEARCH_DAYS * 24 * 60 * 60 * 1000);

    // First attempt: search with original query
    let result = await getNews(
      { search: query, fromDate },
      { page: 1, limit: NEWS_SEARCH_LIMIT }
    );

    // If no results, try fallback searches
    if (result.items.length === 0) {
      // If query contains Chinese characters, try extracting English keywords
      if (/[\u4e00-\u9fff]/.test(query)) {
        const englishWords = query.match(/[a-zA-Z]+/g);
        if (englishWords && englishWords.length > 0) {
          const englishQuery = englishWords.join(' ');
          result = await getNews(
            { search: englishQuery, fromDate },
            { page: 1, limit: NEWS_SEARCH_LIMIT }
          );
        }
      } else {
        // For English queries, try shorter keywords (last 1-2 words)
        const words = query.split(' ').filter(w => w.length >= 2);
        if (words.length > 1) {
          // Try the last word (most likely to be the topic)
          const lastWord = words[words.length - 1];
          result = await getNews(
            { search: lastWord, fromDate },
            { page: 1, limit: NEWS_SEARCH_LIMIT }
          );
        }
      }
    }

    return result.items;
  } catch (error) {
    console.error('[AI Chat] News search error:', error);
    return [];
  }
}

/**
 * Build system prompt with news context
 */
function buildNewsContextPrompt(newsItems: NewsItem[]): string {
  if (newsItems.length === 0) {
    return `You are a helpful AI assistant. When users ask about recent news or current events, inform them that no relevant news data is currently available in the system. Otherwise, answer based on your general knowledge.`;
  }

  const newsList = newsItems
    .map((item, index) => {
      const source = item.source_url || 'unknown';
      const pubDate = item.pub_date ? new Date(item.pub_date).toLocaleDateString('zh-CN') : '';
      return `${index + 1}. ${item.title} [${source}]${pubDate ? ` (${pubDate})` : ''}`;
    })
    .join('\n');

  return `You are a helpful AI assistant specializing in news analysis.

The following are the latest news items relevant to the user's question:
${newsList}

Please provide an answer based on the news items above. If the news items don't contain enough information to fully answer the question, acknowledge what you can determine from the available news and indicate if the news doesn't cover the topic.`;
}

/**
 * Extract search keywords from user message
 * For English: keeps important content words, removes question words
 * For Chinese: removes common question particles
 */
function extractKeywords(message: string): string {
  // Chinese stop words
  const chineseStopWords = ['的', '是', '在', '有', '什么', '哪些', '怎么', '如何', '为什么', '哪里', '哪个', '吗', '呢', '吧', '啊'];
  // English stop words (basic question words, articles, prepositions, and common qualifiers)
  const englishStopWords = ['what', 'which', 'who', 'whom', 'whose', 'how', 'why', 'when', 'where', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'have', 'has', 'had', 'this', 'that', 'these', 'those', 'it', 'its', 'latest', 'recent', 'current', 'new', 'news', 'about', 'tell', 'give', 'me', 'some', 'any'];

  const cleanMessage = message
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
    .trim();

  // Check if message contains Chinese characters
  const hasChinese = /[\u4e00-\u9fff]/.test(message);

  if (hasChinese) {
    // For Chinese: remove stop words using string replacement
    let keywords = cleanMessage;
    for (const stop of chineseStopWords) {
      keywords = keywords.replace(new RegExp(stop, 'g'), ' ');
    }
    keywords = keywords.replace(/\s+/g, ' ').trim();
    // If result is too short, return original message
    return keywords.length >= 2 ? keywords : message;
  }

  // For English: use split/filter approach
  const stopWords = englishStopWords;
  let keywords = cleanMessage;
  for (const stop of stopWords) {
    const parts = keywords.split(' ');
    const filtered = parts.filter(w => w.toLowerCase() !== stop.toLowerCase());
    keywords = filtered.join(' ');
  }

  keywords = keywords.replace(/\s+/g, ' ').trim();

  // If keywords are too short or empty, use the original message
  if (keywords.length < 2) {
    return message;
  }

  // For English queries, filter to keep only significant words (>= 2 chars or known important terms)
  const words = keywords.split(' ').filter(w => {
    // Keep words with 2+ characters
    if (w.length >= 2) return true;
    // Also keep short important tech/news/geopolitical terms (case-insensitive)
    const shortImportant = ['ai', 'ml', 'it', 'tv', 'uk', 'eu', 'us', 'un', 'nato', 'eu', 'is', 'in', 'on', 'to', 'by', 'of', 'us', 'ir', 'il', 'uk'];
    return shortImportant.includes(w.toLowerCase());
  });
  keywords = words.join(' ');

  // If filtered result is too short, fall back to original message
  if (keywords.length < 2) {
    return message;
  }

  return keywords;
}

/**
 * POST /api/ai/chat
 * Chat completion endpoint with RAG news context
 *
 * Accepts both formats:
 * 1. { messages: [{role, content}], ... } - standard format
 * 2. { message: "text", context?: {...} } - simple single message format
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, message, context, model, temperature, max_tokens } = req.body;

    let chatMessages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    let userQuery = '';

    if (messages && Array.isArray(messages)) {
      // Standard format: messages array
      chatMessages = messages;
      // Extract last user message as query
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      userQuery = lastUserMsg?.content || '';
    } else if (message && typeof message === 'string') {
      // Simple format: single message string with optional context
      userQuery = message;
      chatMessages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Either messages array or message string is required',
      });
    }

    // RAG: Search for relevant news if user query exists
    let relevantNews: NewsItem[] = [];
    let systemPrompt = '';

    if (userQuery.trim()) {
      const keywords = extractKeywords(userQuery);
      relevantNews = await searchNewsForChat(keywords);
      systemPrompt = buildNewsContextPrompt(relevantNews);
    }

    // Build messages with system prompt
    const fullMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    if (systemPrompt) {
      fullMessages.push({ role: 'system', content: systemPrompt });
    }

    // Add existing messages or just the user message
    if (messages && Array.isArray(messages)) {
      fullMessages.push(...messages);
    } else {
      fullMessages.push({ role: 'user', content: message });
    }

    const result = await chat({
      model: model || 'default',
      messages: fullMessages,
      temperature,
      max_tokens,
    });

    res.json({
      response: result.response.choices[0]?.message?.content || 'No response',
      provider: result.provider,
      news: relevantNews.map(n => ({
        id: n.id,
        title: n.title,
        source: n.source_url,
        pubDate: n.pub_date,
        link: n.link,
      })),
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
