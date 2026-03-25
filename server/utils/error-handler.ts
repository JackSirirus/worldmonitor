/**
 * Error Handler Utilities
 * Retry decorators and error handling utilities
 */

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  options: RetryOptions
): number {
  const delay = Math.min(
    options.initialDelay * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelay
  );

  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25;

  return Math.floor(delay + jitter);
}

/**
 * Retry function decorator
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: Partial<RetryOptions> = {}
): T {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn(...args) as ReturnType<T>;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on final attempt
        if (attempt >= opts.maxRetries) {
          break;
        }

        // Call retry callback if provided
        opts.onRetry?.(lastError, attempt + 1);

        // Calculate and wait
        const delay = calculateBackoffDelay(attempt, opts);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
      }
    }

    throw lastError;
  }) as T;
}

/**
 * Retry decorator for class methods
 */
export function retry(options: Partial<RetryOptions> = {}) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt >= opts.maxRetries) {
            break;
          }

          const delay = calculateBackoffDelay(attempt, opts);
          console.log(`[Retry] ${propertyKey} attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await sleep(delay);
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Circuit breaker state
 */
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

/**
 * Simple circuit breaker
 */
export class CircuitBreaker {
  private state: CircuitState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  };

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 60000 // 1 minute
  ) {}

  /**
   * Execute with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      // Check if we should transition to half-open
      if (Date.now() - this.state.lastFailure >= this.resetTimeout) {
        this.state.state = 'half-open';
        console.log('[CircuitBreaker] Transitioning to half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Success - close the circuit
      if (this.state.state !== 'closed') {
        this.state.state = 'closed';
        this.state.failures = 0;
        console.log('[CircuitBreaker] Circuit closed');
      }

      return result;
    } catch (error) {
      this.state.failures++;
      this.state.lastFailure = Date.now();

      if (this.state.failures >= this.threshold) {
        this.state.state = 'open';
        console.log('[CircuitBreaker] Circuit opened');
      }

      throw error;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return { ...this.state };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    };
  }
}

export default {
  withRetry,
  retry,
  withTimeout,
  CircuitBreaker,
  calculateBackoffDelay,
  DEFAULT_RETRY_OPTIONS,
};
