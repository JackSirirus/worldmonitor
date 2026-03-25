/**
 * Podcasts API Routes
 * GET /api/podcasts - List all podcasts
 * GET /api/podcasts/:id - Get a specific podcast (audio file)
 * POST /api/podcasts/generate - Trigger podcast generation
 */

import { Router } from 'express';
import { query } from '../database/connection.js';
import { generatePodcast } from '../agent/tts.js';
import { logger } from '../utils/logger.js';
import { existsSync } from 'fs';
import { join } from 'path';

const router = Router();

const PODCAST_DIR = process.env.PODCAST_DIR || '/podcasts';

export interface Podcast {
  id: number;
  title: string;
  content: string;
  voice: string | null;
  audio_path: string | null;
  duration: number | null;
  status: string;
  error_message: string | null;
  created_at: Date;
}

/**
 * GET /api/podcasts
 * List all podcasts with pagination
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query<Podcast>(
      'SELECT id, title, voice, duration, status, created_at FROM podcasts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM podcasts'
    );

    res.json({
      podcasts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (error) {
    logger.error({ err: error }, '[Podcasts API] Error fetching podcasts');
    res.status(500).json({
      error: 'Failed to fetch podcasts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/podcasts/:id
 * Get a specific podcast by ID - returns audio file
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid podcast ID' });
    }

    const result = await query<Podcast>(
      'SELECT * FROM podcasts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    const podcast = result.rows[0];

    // If no audio_path or file doesn't exist, return metadata
    if (!podcast.audio_path || !existsSync(podcast.audio_path)) {
      return res.json({
        ...podcast,
        audioUrl: null,
        message: 'Audio file not available',
      });
    }

    // Return the audio file
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${podcast.title}.mp3"`);

    // Use streaming approach
    const fs = await import('fs');
    const stream = fs.createReadStream(podcast.audio_path);
    stream.pipe(res);
  } catch (error) {
    logger.error({ err: error }, '[Podcasts API] Error fetching podcast');
    res.status(500).json({
      error: 'Failed to fetch podcast',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/podcasts/generate
 * Generate a new podcast from text content
 */
router.post('/generate', async (req, res) => {
  try {
    const { title, content, voice } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    logger.info({ title, voice }, '[Podcasts API] Generating podcast');

    // Generate the podcast audio
    const result = await generatePodcast(title, content, voice);

    // Save to database
    const podcastResult = await query<Podcast>(
      `INSERT INTO podcasts (title, content, voice, audio_path, duration, status)
       VALUES ($1, $2, $3, $4, $5, 'completed')
       RETURNING *`,
      [title, content, voice || 'en-US-AriaNeural', result.filepath, result.duration]
    );

    res.json({
      success: true,
      podcast: podcastResult.rows[0],
      audioUrl: `/api/podcasts/${podcastResult.rows[0].id}`,
    });
  } catch (error) {
    logger.error({ err: error }, '[Podcasts API] Error generating podcast');

    // Save failed podcast record
    try {
      const { title, content } = req.body;
      await query(
        `INSERT INTO podcasts (title, content, status, error_message)
         VALUES ($1, $2, 'failed', $3)`,
        [title || 'Unknown', content || '', error instanceof Error ? error.message : 'Unknown error']
      );
    } catch {
      // Ignore db error
    }

    res.status(500).json({
      error: 'Failed to generate podcast',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
