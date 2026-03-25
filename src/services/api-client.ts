/**
 * API Client Service
 * Frontend client for the new backend API (agent system, news storage, reports)
 * Provides graceful degradation if backend is unavailable
 */

const API_BASE = '/api';

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  pub_date?: string;
  category?: string;
}

interface AgentTask {
  id: string;
  type: string;
  status: string;
  result?: unknown;
  created_at?: string;
}

interface Report {
  id: number;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

/**
 * Fetch news from the backend API
 */
export async function fetchNewsFromApi(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsItem[]> {
  try {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    const url = `${API_BASE}/news${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[ApiClient] News fetch failed:', response.status);
      return [];
    }

    const result = await response.json() as { data?: NewsItem[] };
    return result.data || [];
  } catch (error) {
    console.warn('[ApiClient] News fetch error:', error);
    return [];
  }
}

/**
 * Create a new agent task for background processing
 */
export async function createAgentTask<T>(task: {
  type: 'rss' | 'analysis' | 'query' | 'deep-thinking' | 'fact-check';
  payload: T;
  priority?: number;
}): Promise<AgentTask | null> {
  try {
    const response = await fetch(`${API_BASE}/agent/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      console.warn('[ApiClient] Agent task creation failed:', response.status);
      return null;
    }

    return await response.json() as AgentTask;
  } catch (error) {
    console.warn('[ApiClient] Agent task error:', error);
    return null;
  }
}

/**
 * Get agent task status
 */
export async function getAgentTask(taskId: string): Promise<AgentTask | null> {
  try {
    const response = await fetch(`${API_BASE}/agent/tasks/${taskId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json() as AgentTask;
  } catch {
    return null;
  }
}

/**
 * Fetch stored reports
 */
export async function fetchReports(options?: {
  type?: string;
  limit?: number;
}): Promise<Report[]> {
  try {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.limit) params.set('limit', String(options.limit));

    const url = `${API_BASE}/reports${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const result = await response.json() as { data?: Report[] };
    return result.data || [];
  } catch (error) {
    console.warn('[ApiClient] Reports fetch error:', error);
    return [];
  }
}

/**
 * Store a new report
 */
export async function createReport(report: {
  title: string;
  content: string;
  type: string;
}): Promise<Report | null> {
  try {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      console.warn('[ApiClient] Report creation failed:', response.status);
      return null;
    }

    return await response.json() as Report;
  } catch (error) {
    console.warn('[ApiClient] Report creation error:', error);
    return null;
  }
}

/**
 * Query AI chat endpoint
 */
export async function chatWithAI(message: string, context?: {
  newsIds?: number[];
  summary?: string;
}): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      console.warn('[ApiClient] AI chat failed:', response.status);
      return null;
    }

    const result = await response.json() as { response?: string };
    return result.response || null;
  } catch (error) {
    console.warn('[ApiClient] AI chat error:', error);
    return null;
  }
}

/**
 * Check if backend API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  hits: number;
  misses: number;
  hitRate: number;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/cache-telemetry`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export default {
  fetchNewsFromApi,
  createAgentTask,
  getAgentTask,
  fetchReports,
  createReport,
  chatWithAI,
  checkApiHealth,
  getCacheStats,
};
