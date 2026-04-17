/**
 * AI Providers Service
 * Multi-provider AI chat interface with automatic failover
 * Includes rate limiting, request coalescing, and multi-tier fallback
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface RateLimitInfo {
  limitRequests: number;
  remainingRequests: number;
  resetRequests: string;
  limitTokens: number;
  remainingTokens: number;
  retryAfter?: number;
}

export interface AIProvider {
  name: string;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  isHealthy(): boolean;
}

// ============================================================================
// Rate Limited Queue
// ============================================================================

/**
 * Parses rate limit headers from API response
 */
export function parseRateLimitHeaders(response: Response): RateLimitInfo {
  const getHeader = (name: string): number | string | undefined => {
    const value = response.headers.get(name);
    if (value === null) return undefined;
    const num = Number(value);
    return isNaN(num) ? value : num;
  };

  return {
    limitRequests: (getHeader('x-ratelimit-limit-requests') as number) || 14400,
    remainingRequests: (getHeader('x-ratelimit-remaining-requests') as number) || 14399,
    resetRequests: (getHeader('x-ratelimit-reset-requests') as string) || '',
    limitTokens: (getHeader('x-ratelimit-limit-tokens') as number) || 18000,
    remainingTokens: (getHeader('x-ratelimit-remaining-tokens') as number) || 17999,
    retryAfter: response.status === 429 ? (getHeader('retry-after') as number) : undefined,
  };
}

/**
 * RateLimitedQueue - Controls API call frequency to stay within rate limits
 */
class RateLimitedQueue {
  private queue: Array<{
    request: ChatCompletionRequest;
    resolve: (value: ChatCompletionResponse) => void;
    reject: (error: Error) => void;
    priority: number;
  }> = [];

  private processing = false;
  private lastRequestTime = 0;
  private cooldownUntil = 0; // Don't make requests until this time

  // Groq free tier: ~14-30 RPM, use conservative 10 RPM
  private minInterval = 60000 / 10; // ~6 seconds between requests

  /**
   * Update rate limit info from API response
   */
  updateRateLimit(info: RateLimitInfo): void {
    if (info.remainingRequests > 0) {
      // Dynamic interval based on remaining requests
      this.minInterval = Math.max(2000, 60000 / Math.min(info.remainingRequests, 10));
    }
    if (info.remainingRequests < 10) {
      // Very low remaining, increase interval significantly
      this.minInterval = Math.max(4000, 60000 / info.remainingRequests);
    }
  }

  /**
   * Add a request to the queue
   */
  async add(
    request: ChatCompletionRequest,
    provider: AIProvider,
    priority: number = 0
  ): Promise<ChatCompletionResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject, priority });
      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue(provider);
    });
  }

  private async processQueue(provider: AIProvider): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    const now = Date.now();

    // Check if we're in cooldown due to rate limiting
    if (now < this.cooldownUntil) {
      const waitTime = this.cooldownUntil - now;
      setTimeout(() => this.processQueue(provider), waitTime);
      return;
    }

    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      // Wait until minimum interval has passed
      setTimeout(() => this.processQueue(provider), this.minInterval - timeSinceLastRequest);
      return;
    }

    this.processing = true;
    const item = this.queue.shift()!;

    try {
      this.lastRequestTime = Date.now();
      const response = await provider.chat(item.request);
      item.resolve(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // If rate limited, set cooldown for 60 seconds
      if (message.includes('429') || message.includes('rate limit')) {
        this.cooldownUntil = Date.now() + 60000;
        console.log(`[RateLimit] Rate limited, cooldown until ${new Date(this.cooldownUntil).toISOString()}`);
      }
      item.reject(error instanceof Error ? error : new Error(String(error)));
    }

    this.processing = false;

    // Continue processing if more items in queue
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(provider), 100);
    }
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Global rate limited queue for Groq
const groqRateLimitQueue = new RateLimitedQueue();

// Request coalescing - cache ongoing requests to deduplicate
const pendingRequests = new Map<string, Promise<ChatCompletionResponse>>();

/**
 * Get or create a request with coalescing
 * If a request with the same cacheKey is already in progress, returns the existing promise
 */
function getOrCreateRequest(
  cacheKey: string,
  request: ChatCompletionRequest,
  provider: AIProvider,
  priority: number = 0
): Promise<ChatCompletionResponse> {
  const existing = pendingRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = groqRateLimitQueue.add(request, provider, priority);
  pendingRequests.set(cacheKey, promise);

  // Clean up when done
  promise.finally(() => {
    pendingRequests.delete(cacheKey);
  });

  return promise;
}

// Fallback order: Groq -> OpenRouter -> MiniMax -> Lepton
const FALLBACK_ORDER = ['Groq', 'OpenRouter', 'MiniMax', 'Lepton'];
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chat with automatic retry, rate limiting, and multi-tier fallback
 */
async function chatWithFallback(
  request: ChatCompletionRequest,
  providerName: string,
  isPrimary: boolean = false
): Promise<{ response: ChatCompletionResponse; provider: string; fallback: boolean }> {
  const provider = providers.find(p => p.name === providerName);
  if (!provider || !provider.isHealthy()) {
    throw new Error(`${providerName} is not available`);
  }

  try {
    if (providerName === 'Groq' && isPrimary) {
      // Skip Groq if it keeps failing with auth errors - use direct call to allow fallback
      // The rate-limited queue doesn't handle 403 errors well
      const response = await provider.chat(request);
      return { response, provider: providerName, fallback: false };
    } else {
      // Direct call for fallback providers
      const response = await provider.chat(request);
      return { response, provider: providerName, fallback: providerName !== 'Groq' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Check if it's a rate limit error or authentication error
    if (message.includes('429') || message.includes('rate limit') ||
        message.includes('403') || message.includes('Forbidden') ||
        message.includes('401') || message.includes('Unauthorized')) {
      // These errors are unlikely to succeed on retry, throw immediately to trigger fallback
      console.log(`[AI] ${providerName} failed with ${message.includes('403') || message.includes('Forbidden') ? 'auth error' : 'rate limit'}, skipping...`);
      throw error; // Let outer handler deal with fallback
    }

    throw error;
  }
}

/**
 * MiniMax Provider (Coding Plan - Anthropic Compatible)
 */
class MiniMaxProvider implements AIProvider {
  name = 'MiniMax';

  private get apiKey(): string {
    return process.env.MINIMAX_API_KEY || '';
  }

  private get baseUrl(): string {
    // Coding Plan uses Anthropic-compatible endpoint
    return process.env.MINIMAX_API_BASE || 'https://api.minimaxi.com';
  }

  private get isCodingPlan(): boolean {
    // Check if using coding plan (default to true if baseUrl contains anthropic)
    return this.baseUrl.includes('/anthropic') || !this.baseUrl.includes('/chat');
  }

  isHealthy(): boolean {
    return !!this.apiKey;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('MiniMax API key not configured');
    }

    // Use Anthropic-compatible format for Coding Plan
    if (this.isCodingPlan) {
      return this.chatAnthropicFormat(request);
    }

    // Fallback to OpenAI-compatible format
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }

  private async chatAnthropicFormat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Convert OpenAI format to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const userMessages = request.messages.filter(m => m.role !== 'system');

    // Map model names - handle both Groq and OpenAI model names
    let model = request.model;
    if (model === 'default' || !model || model.includes('llama') || model.includes('gpt')) {
      model = 'MiniMax-M2.5';
    }

    const anthropicRequest = {
      model,
      max_tokens: request.max_tokens || 4096,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    // Convert Anthropic response to OpenAI format
    // MiniMax returns content as array: [{type: 'thinking', ...}, {type: 'text', text: '...'}]
    // We need to find the first 'text' type item
    const textContent = data.content?.find((c: any) => c.type === 'text');
    const content = textContent?.text || '';
    const usage = data.usage ? {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined;

    return {
      id: data.id || `minimax-${Date.now()}`,
      model: data.model || model,
      choices: [{
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: data.stop_reason || 'stop',
      }],
      usage,
    };
  }
}

/**
 * Groq Provider with rate limit awareness
 */
class GroqProvider implements AIProvider {
  name = 'Groq';

  private get apiKey(): string {
    return process.env.GROQ_API_KEY || '';
  }

  private get baseUrl(): string {
    return 'https://api.groq.com/openai/v1';
  }

  isHealthy(): boolean {
    return !!this.apiKey;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    // Map model names to Groq-compatible names
    let model = request.model;
    if (model === 'default' || !model) {
      model = 'llama-3.1-8b-instant'; // Default Groq model
    }
    // Groq uses model names without the "meta-llama/" prefix
    model = model.replace(/^meta-llama\//, '');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ ...request, model }),
    });

    // Parse and update rate limit info
    const rateLimitInfo = parseRateLimitHeaders(response);
    groqRateLimitQueue.updateRateLimit(rateLimitInfo);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }
}

/**
 * OpenRouter Provider
 */
class OpenRouterProvider implements AIProvider {
  name = 'OpenRouter';

  private get apiKey(): string {
    return process.env.OPENROUTER_API_KEY || '';
  }

  private get baseUrl(): string {
    return 'https://openrouter.ai/api/v1';
  }

  isHealthy(): boolean {
    return !!this.apiKey;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://worldmonitor.app',
        'X-Title': 'WorldMonitor',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }
}

/**
 * Lepton AI Provider
 */
class LeptonProvider implements AIProvider {
  name = 'Lepton';

  private get apiKey(): string {
    return process.env.LEPTON_API_KEY || '';
  }

  private get baseUrl(): string {
    return 'https://api.lepton.ai/rest/v1';
  }

  isHealthy(): boolean {
    return !!this.apiKey;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Lepton API key not configured');
    }

    // Map model names to Lepton-compatible names
    let model = request.model;
    if (model === 'default' || !model) {
      model = 'llama-3.1-8b-instant';
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ ...request, model }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lepton API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }
}

// Provider instances (Groq first for fastest response)
const providers: AIProvider[] = [
  new GroqProvider(),
  new MiniMaxProvider(),
  new OpenRouterProvider(),
  new LeptonProvider(),
];

// Health tracking
const providerHealth = new Map<string, { failures: number; lastSuccess: number }>();

/**
 * Get available (healthy) providers in priority order
 */
function getAvailableProviders(): AIProvider[] {
  return providers.filter(p => p.isHealthy());
}

/**
 * Record provider success
 */
function recordSuccess(provider: AIProvider): void {
  providerHealth.set(provider.name, {
    failures: 0,
    lastSuccess: Date.now(),
  });
}

/**
 * Record provider failure
 */
function recordFailure(provider: AIProvider): void {
  const current = providerHealth.get(provider.name) || { failures: 0, lastSuccess: 0 };
  providerHealth.set(provider.name, {
    failures: current.failures + 1,
    lastSuccess: current.lastSuccess,
  });
}

/**
 * Get provider health status
 */
export function getProviderHealth(): Array<{ name: string; healthy: boolean; failures: number }> {
  return providers.map(p => {
    const health = providerHealth.get(p.name) || { failures: 0 };
    return {
      name: p.name,
      healthy: p.isHealthy(),
      failures: health.failures,
    };
  });
}

/**
 * Chat with automatic failover, rate limiting, and multi-tier fallback
 */
export async function chat(
  request: ChatCompletionRequest,
  options?: { skipRateLimit?: boolean }
): Promise<{
  response: ChatCompletionResponse;
  provider: string;
  fallback: boolean;
}> {
  const available = getAvailableProviders();

  if (available.length === 0) {
    throw new Error('No AI providers available. Please configure at least one API key.');
  }

  const errors: Array<{ provider: string; error: string }> = [];

  // Try providers in fallback order
  for (const providerName of FALLBACK_ORDER) {
    if (!available.find(p => p.name === providerName)) {
      continue; // Skip unavailable providers
    }

    const isPrimary = providerName === 'Groq';

    try {
      const result = await chatWithFallback(request, providerName, isPrimary);
      recordSuccess(available.find(p => p.name === providerName)!);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ provider: providerName, error: message });
      recordFailure(available.find(p => p.name === providerName)!);

      // Log fallback event
      if (providerName !== FALLBACK_ORDER[FALLBACK_ORDER.length - 1]) {
        console.log(`[AI] ${providerName} failed (${message}), trying next fallback...`);
      }
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join('; ')}`);
}

/**
 * Simple chat wrapper
 */
export async function simpleChat(
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const { response } = await chat({
    model: options?.model || 'default',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: options?.temperature ?? 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

export default {
  chat,
  simpleChat,
  getProviderHealth,
  getAvailableProviders,
};
