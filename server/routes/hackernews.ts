/**
 * HackerNews API - Front page stories
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

const ALLOWED_STORY_TYPES = new Set(['top', 'new', 'best', 'ask', 'show', 'job']);
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;
const MAX_CONCURRENCY = 10;

function parseLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit || '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, parsed));
}

router.get('/', async (req, res) => {
  try {
    const { type, limit } = req.query;

    const requestedType = (type as string) || 'top';
    const storyType = ALLOWED_STORY_TYPES.has(requestedType) ? requestedType : 'top';
    const limitNum = parseLimit(limit as string);

    // HackerNews official Firebase API
    const storiesUrl = `https://hacker-news.firebaseio.com/v0/${storyType}stories.json`;

    // Fetch story IDs
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const storiesResponse = await fetch(storiesUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!storiesResponse.ok) {
      throw new Error(`HackerNews API returned ${storiesResponse.status}`);
    }

    const storyIds = await storiesResponse.json();
    if (!Array.isArray(storyIds)) {
      throw new Error('HackerNews API returned unexpected payload');
    }
    const limitedIds = storyIds.slice(0, limitNum);

    // Fetch story details in bounded batches
    const stories = [];
    for (let i = 0; i < limitedIds.length; i += MAX_CONCURRENCY) {
      const batchIds = limitedIds.slice(i, i + MAX_CONCURRENCY);
      const storyPromises = batchIds.map(async (id) => {
        const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
        try {
          const storyController = new AbortController();
          const storyTimeout = setTimeout(() => storyController.abort(), 5000);
          const response = await fetch(storyUrl, {
            signal: storyController.signal,
          });
          clearTimeout(storyTimeout);
          if (response.ok) {
            return await response.json() as any;
          }
          return null;
        } catch (error) {
          console.error(`[HackerNews] Failed to fetch story ${id}:`, error.message);
          return null;
        }
      });
      const batchResults = await Promise.all(storyPromises);
      stories.push(...batchResults.filter((story) => story !== null));
    }

    res.status(200)
      .set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      })
      .json({
        type: storyType,
        stories,
        total: stories.length,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('[HackerNews] Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch Hacker News data',
      message: error.message
    });
  }
});

export { router };
