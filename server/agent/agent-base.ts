/**
 * Agent Base Class
 * Core framework for all AI agents
 */

import { createTask, updateTaskStatus, updateTaskResult } from '../repositories/task.js';
import { createLog } from '../repositories/log.js';
import { broadcastAgentStatus, broadcastTaskProgress } from './websocket-server.js';

export interface AgentConfig {
  name: string;
  description: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base Agent class
 */
export abstract class Agent {
  public readonly name: string;
  public readonly description: string;
  protected readonly timeout: number;
  protected readonly maxRetries: number;
  protected taskId?: number;
  protected sessionId: string;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.description = config.description;
    this.timeout = config.timeout || 300000; // 5 minutes default
    this.maxRetries = config.maxRetries || 3;
    this.sessionId = `agent-${this.name}-${Date.now()}`;
  }

  /**
   * Run the agent
   */
  async run(input?: unknown): Promise<AgentResult> {
    const startTime = Date.now();
    this.sessionId = `agent-${this.name}-${Date.now()}`;

    // Create task in database
    this.taskId = await createTask({
      task_type: this.name,
      params: { input },
    });

    // Broadcast status
    broadcastAgentStatus({
      agentId: this.name,
      status: 'running',
      progress: 0,
      message: 'Starting...',
    });

    await this.log('info', `Agent ${this.name} started`);

    try {
      // Update status to running
      await updateTaskStatus(this.taskId, 'running');

      // Execute the agent logic
      const result = await this.execute(input);

      // Update status to completed
      await updateTaskStatus(this.taskId, 'completed');
      await updateTaskResult(this.taskId, result as Record<string, unknown>);

      await this.log('info', `Agent ${this.name} completed in ${Date.now() - startTime}ms`);

      // Broadcast completion
      broadcastAgentStatus({
        agentId: this.name,
        status: 'completed',
        progress: 100,
        message: 'Completed successfully',
      });

      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.log('error', `Agent ${this.name} failed: ${errorMessage}`);
      await updateTaskStatus(this.taskId, 'failed', errorMessage);

      broadcastAgentStatus({
        agentId: this.name,
        status: 'failed',
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute agent logic (to be implemented by subclasses)
   */
  protected abstract execute(input?: unknown): Promise<unknown>;

  /**
   * Log a message
   */
  protected async log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, unknown>): Promise<void> {
    await createLog({
      task_id: this.name,
      session_id: this.sessionId,
      level,
      message,
      context,
    });
  }

  /**
   * Report progress
   */
  protected reportProgress(progress: number, message?: string): void {
    if (this.taskId) {
      broadcastTaskProgress(this.taskId.toString(), progress, message);
    }
  }

  /**
   * Get task ID
   */
  getTaskId(): number | undefined {
    return this.taskId;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * RSS Collector Agent
 */
export class RSSCollectorAgent extends Agent {
  constructor() {
    super({
      name: 'rss-collect',
      description: 'Collects RSS feeds from configured sources',
      timeout: 600000, // 10 minutes
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    const { fetchRSSSources } = await import('./rss-collector.js');

    this.reportProgress(10, 'Fetching RSS sources...');
    const result = await fetchRSSSources(this.sessionId);

    this.reportProgress(100, 'RSS collection complete');
    return result;
  }
}

/**
 * Report Generator Agent
 */
export class ReportGeneratorAgent extends Agent {
  constructor() {
    super({
      name: 'report',
      description: 'Generates daily/weekly reports',
      timeout: 900000, // 15 minutes
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    const { generateDailySummary } = await import('./report-generator.js');

    this.reportProgress(10, 'Generating report...');
    const result = await generateDailySummary();

    this.reportProgress(100, 'Report generated');
    return result;
  }
}

/**
 * Web Search Agent
 */
export class WebSearchAgent extends Agent {
  constructor() {
    super({
      name: 'web-search',
      description: 'Performs web searches for information',
      timeout: 300000, // 5 minutes
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    const { search } = await import('./web-search.js');

    if (!input || typeof input !== 'string') {
      throw new Error('Search query required');
    }

    this.reportProgress(50, `Searching for: ${input}`);
    const result = await search(input);

    this.reportProgress(100, 'Search complete');
    return result;
  }
}

/**
 * TTS Agent
 */
export class TTSAgent extends Agent {
  constructor() {
    super({
      name: 'tts',
      description: 'Converts text to speech',
      timeout: 600000, // 10 minutes
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    const { generateSpeech } = await import('./tts.js');

    if (!input || typeof input !== 'object' || !('text' in input) || !('voice' in input)) {
      throw new Error('Text and voice required');
    }

    this.reportProgress(50, 'Generating speech...');
    const result = await generateSpeech(input.text as string, input.voice as string);

    this.reportProgress(100, 'Speech generated');
    return result;
  }
}

/**
 * Agent Factory
 */
export async function createAgent(type: string): Promise<Agent> {
  switch (type) {
    case 'rss-collect':
      return new RSSCollectorAgent();
    case 'report':
      return new ReportGeneratorAgent();
    case 'web-search':
      return new WebSearchAgent();
    case 'tts':
      return new TTSAgent();
    case 'data-analysis': {
      const { DataAnalysisAgent } = await import('./analysis-agent.js');
      return new DataAnalysisAgent();
    }
    case 'info-query': {
      const { InfoQueryAgent } = await import('./info-query-agent.js');
      return new InfoQueryAgent();
    }
    case 'deep-thinking': {
      const { DeepThinkingAgent } = await import('./deep-thinking-agent.js');
      return new DeepThinkingAgent();
    }
    case 'fact-check': {
      const { FactCheckAgent } = await import('./fact-check-agent.js');
      return new FactCheckAgent();
    }
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

export default {
  Agent,
  RSSCollectorAgent,
  ReportGeneratorAgent,
  WebSearchAgent,
  TTSAgent,
  createAgent,
};
