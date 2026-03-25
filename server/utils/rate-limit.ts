/**
 * IP Rate limiting middleware for Express
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxEntries?: number;
  cleanupIntervalMs?: number;
}

export function createIpRateLimiter({
  limit,
  windowMs,
  maxEntries = 5000,
  cleanupIntervalMs = 30 * 1000,
}: RateLimiterOptions) {
  const records = new Map<string, RateLimitRecord>();
  let lastCleanupAt = 0;

  function cleanup(now: number) {
    if (now - lastCleanupAt < cleanupIntervalMs && records.size <= maxEntries) {
      return;
    }
    lastCleanupAt = now;

    const cutoff = now - windowMs;
    for (const [ip, record] of records) {
      if (record.windowStart < cutoff) {
        records.delete(ip);
      }
    }

    if (records.size <= maxEntries) {
      return;
    }

    const overflow = records.size - maxEntries;
    const oldest = Array.from(records.entries())
      .sort((a, b) => a[1].windowStart - b[1].windowStart);
    for (let i = 0; i < overflow; i++) {
      const entry = oldest[i];
      if (!entry) break;
      records.delete(entry[0]);
    }
  }

  function check(ip: string): boolean {
    const now = Date.now();
    cleanup(now);

    const key = (ip || 'unknown').trim() || 'unknown';
    const record = records.get(key);

    if (!record || now - record.windowStart > windowMs) {
      records.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count += 1;
    return true;
  }

  return {
    check,
    size: () => records.size,
  };
}

// Express middleware factory
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Simple global rate limiter for AI endpoints
  const limit = parseInt(process.env.RATE_LIMIT || '100', 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

  const limiter = createIpRateLimiter({
    limit,
    windowMs,
    maxEntries: 1000,
    cleanupIntervalMs: 30000,
  });

  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
  if (!limiter.check(ip)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  next();
}
