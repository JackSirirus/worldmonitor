/**
 * Graceful Degradation Utilities
 * Handles service failures gracefully
 */

import { logger } from './logger.js';

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Wrap a function with graceful degradation
 */
export async function withGracefulDegradation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string,
  logErrors: boolean = true
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (logErrors) {
      logger.warn({ err: error }, `[Degradation] ${operationName} failed, using fallback`);
    }
    return fallback;
  }
}

/**
 * Wrap a function with retry and graceful degradation
 */
export async function withRetryAndDegradation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn({ attempt, error: lastError.message }, `[Degradation] ${operationName} attempt ${attempt} failed`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  logger.error({ err: lastError }, `[Degradation] ${operationName} failed after ${maxRetries} attempts, using fallback`);
  return fallback;
}

/**
 * Cache for fallback data
 */
const fallbackCache = new Map<string, { data: unknown; expiresAt: number }>();

/**
 * Get cached fallback or compute new one
 */
export function getOrComputeFallback<T>(
  key: string,
  compute: () => T,
  ttlSeconds: number = 300
): T {
  const cached = fallbackCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const data = compute();
  fallbackCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  return data;
}

/**
 * Clear fallback cache
 */
export function clearFallbackCache(): void {
  fallbackCache.clear();
}

/**
 * Circuit breaker wrapper
 */
export class ServiceCircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure >= this.resetTimeout) {
        this.state = 'half-open';
        logger.info('[CircuitBreaker] State: half-open');
      } else {
        return fallback;
      }
    }

    try {
      const result = await operation();

      if (this.state !== 'closed') {
        this.state = 'closed';
        this.failures = 0;
        logger.info('[CircuitBreaker] State: closed');
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        logger.warn('[CircuitBreaker] State: open');
      }

      return fallback;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
  }
}

export default {
  withGracefulDegradation,
  withRetryAndDegradation,
  getOrComputeFallback,
  clearFallbackCache,
  ServiceCircuitBreaker,
};
