/**
 * Edge TTS Service
 * Text-to-Speech using Microsoft Edge TTS
 */

import { mkdir, writeFile, unlink, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const EDGE_TTS_VOICES = {
  'en-US': 'en-US-AriaNeural',
  'en-GB': 'en-GB-SoniaNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-TW': 'zh-TW-HsiaoChenNeural',
};

const PODCAST_DIR = process.env.PODCAST_DIR || '/podcasts';
const DEFAULT_VOICE = 'en-US-AriaNeural';

export interface TTSOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
  volume?: string;
}

/**
 * Initialize TTS service
 */
export async function initializeTTS(): Promise<void> {
  if (!existsSync(PODCAST_DIR)) {
    await mkdir(PODCAST_DIR, { recursive: true });
  }
}

/**
 * Convert text to speech
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<{ filepath: string; filename: string }> {
  const { ttsSave } = await import('edge-tts');

  const voice = options.voice || DEFAULT_VOICE;
  const rate = options.rate || '+0%';
  const pitch = options.pitch || '+0Hz';
  const volume = options.volume || '+0%';

  // Create unique filename
  const timestamp = Date.now();
  const filename = `podcast-${timestamp}.mp3`;
  const filepath = join(PODCAST_DIR, filename);

  // Use new edge-tts API
  await ttsSave(text, filepath, {
    voice,
    rate,
    pitch,
    volume,
  });

  return { filepath, filename };
}

/**
 * Generate podcast from text
 */
export async function generatePodcast(
  title: string,
  content: string,
  voice?: string
): Promise<{ filepath: string; filename: string; duration: number }> {
  // Split content into chunks if too long (max ~3000 chars per request)
  const maxChunkSize = 2500;
  const chunks: string[] = [];

  if (content.length > maxChunkSize) {
    // Split by paragraphs
    const paragraphs = content.split('\n\n');
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + para).length > maxChunkSize) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = para;
      } else {
        currentChunk += '\n\n' + para;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
  } else {
    chunks.push(content);
  }

  // Generate audio for each chunk
  const audioFiles: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const result = await textToSpeech(chunks[i], { voice });
    audioFiles.push(result.filepath);
  }

  // For now, just return the first chunk (full implementation would concatenate)
  // A full implementation would use ffmpeg to concatenate audio files

  return {
    filepath: audioFiles[0],
    filename: audioFiles[0].split('/').pop() || '',
    duration: Math.ceil(content.length / 15), // Rough estimate: 15 chars/sec
  };
}

/**
 * Get available voices
 */
export function getVoices(): Record<string, string> {
  return { ...EDGE_TTS_VOICES };
}

/**
 * Clean up old podcast files
 */
export async function cleanupOldPodcasts(retentionDays: number = 3): Promise<number> {
  if (!existsSync(PODCAST_DIR)) return 0;

  const files = await readdir(PODCAST_DIR);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  let deleted = 0;
  for (const file of files) {
    if (!file.startsWith('podcast-') || !file.endsWith('.mp3')) continue;

    const filepath = join(PODCAST_DIR, file);
    const fileStat = await import('fs/promises').then(fs => fs.stat(filepath));

    if (fileStat.mtimeMs < cutoff) {
      await unlink(filepath);
      deleted++;
    }
  }

  return deleted;
}

export default {
  initializeTTS,
  textToSpeech,
  generatePodcast,
  getVoices,
  cleanupOldPodcasts,
};
