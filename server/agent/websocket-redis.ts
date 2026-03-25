/**
 * Redis Adapter for WebSocket
 * Enables WebSocket scaling across multiple instances
 */

import { createClient, RedisClientType } from 'redis';
import { WebSocket } from 'ws';

interface PubSubMessage {
  type: string;
  payload: unknown;
  clientId?: string;
}

let redisClient: RedisClientType | null = null;
let subscriber: RedisClientType | null = null;

/**
 * Initialize Redis adapter for WebSocket pub/sub
 */
export async function initializeRedisAdapter(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

  if (!redisUrl) {
    console.log('[WS Redis] Redis not configured, running in single-instance mode');
    return;
  }

  try {
    // Main client for publishing
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();

    // Subscriber client for receiving messages
    subscriber = redisClient.duplicate();
    await subscriber.connect();

    console.log('[WS Redis] Adapter initialized');
  } catch (error) {
    console.error('[WS Redis] Failed to initialize:', error);
  }
}

/**
 * Publish message to all instances
 */
export async function publish(message: PubSubMessage): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.publish('ws:broadcast', JSON.stringify(message));
  } catch (error) {
    console.error('[WS Redis] Publish error:', error);
  }
}

/**
 * Subscribe to messages from other instances
 */
export function subscribe(callback: (message: PubSubMessage) => void): void {
  if (!subscriber) return;

  subscriber.subscribe('ws:broadcast', (message) => {
    try {
      const data = JSON.parse(message) as PubSubMessage;
      callback(data);
    } catch (error) {
      console.error('[WS Redis] Subscribe parse error:', error);
    }
  });
}

/**
 * Publish agent status to all instances
 */
export async function publishAgentStatus(status: {
  agentId: string;
  status: string;
  progress?: number;
  message?: string;
}): Promise<void> {
  await publish({
    type: 'agent_status',
    payload: status,
  });
}

/**
 * Publish task progress to all instances
 */
export async function publishTaskProgress(taskId: string, progress: number, message?: string): Promise<void> {
  await publish({
    type: 'task_progress',
    payload: { taskId, progress, message },
  });
}

/**
 * Publish news update to all instances
 */
export async function publishNewsUpdate(count: number): Promise<void> {
  await publish({
    type: 'news_update',
    payload: { count, timestamp: new Date().toISOString() },
  });
}

/**
 * Close Redis connections
 */
export async function closeRedisAdapter(): Promise<void> {
  if (subscriber) {
    await subscriber.unsubscribe('ws:broadcast');
    await subscriber.quit();
    subscriber = null;
  }

  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }

  console.log('[WS Redis] Adapter closed');
}

export default {
  initializeRedisAdapter,
  publish,
  subscribe,
  publishAgentStatus,
  publishTaskProgress,
  publishNewsUpdate,
  closeRedisAdapter,
};
