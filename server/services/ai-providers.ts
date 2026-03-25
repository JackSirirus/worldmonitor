/**
 * AI Providers Service
 * Multi-provider AI chat interface with automatic failover
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

export interface AIProvider {
  name: string;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  isHealthy(): boolean;
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

    // Map model names
    let model = request.model;
    if (model === 'default' || !model) {
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
    const content = data.content?.[0]?.type === 'text' ? data.content[0].text : '';
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
 * Groq Provider
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

    // Groq uses model names without the "meta-llama/" prefix
    // e.g., "llama-3.1-8b-instant" instead of "meta-llama/llama-3.1-8b-instant"
    const model = request.model.replace(/^meta-llama\//, '');

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
 * Chat with automatic failover
 */
export async function chat(request: ChatCompletionRequest): Promise<{
  response: ChatCompletionResponse;
  provider: string;
}> {
  const available = getAvailableProviders();

  if (available.length === 0) {
    throw new Error('No AI providers available. Please configure at least one API key.');
  }

  const errors: string[] = [];

  for (const provider of available) {
    try {
      const response = await provider.chat(request);
      recordSuccess(provider);
      return { response, provider: provider.name };
    } catch (error) {
      recordFailure(provider);
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.name}: ${message}`);
      console.error(`[AI] ${provider.name} failed:`, message);
    }
  }

  throw new Error(`All AI providers failed: ${errors.join('; ')}`);
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
