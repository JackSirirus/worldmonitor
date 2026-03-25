/**
 * Upstash Redis cache utilities for Express
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let redisInitFailed = false;

export function getRedis(): Redis | null {
  if (redis) return redis;
  if (redisInitFailed) return null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.log('[Cache] Redis not configured (missing UPSTASH_REDIS_REST_URL or TOKEN)');
    return null;
  }

  try {
    redis = new Redis({ url, token });
    console.log('[Cache] Redis initialized');
  } catch (error) {
    redisInitFailed = true;
    console.warn('[Cache] Redis init failed:', error instanceof Error ? error.message : error);
  }

  return redis;
}

export async function getCachedJson(key: string): Promise<unknown> {
  const redisClient = getRedis();
  if (!redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.warn('[Cache] Read failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
  const redisClient = getRedis();
  if (!redisClient) return false;
  try {
    await redisClient.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.warn('[Cache] Write failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

export function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
