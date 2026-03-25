/**
 * Task Queue Service
 * Simple Redis-based task queue for background job processing
 */

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

const QUEUE_PREFIX = 'wm:queue:';
const PROCESSING_PREFIX = 'wm:processing:';

/**
 * Initialize Redis client for task queue
 */
export async function initializeQueue(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

  if (!redisUrl) {
    console.warn('[Queue] Redis not configured, task queue disabled');
    return;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    console.log('[Queue] Task queue initialized');
  } catch (err) {
    console.error('[Queue] Failed to initialize:', err);
  }
}

/**
 * Get Redis client
 */
function getClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Add task to queue
 */
export async function enqueue<T>(queueName: string, task: {
  id: string;
  type: string;
  payload: T;
  priority?: number;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn('[Queue] Redis not available, skipping enqueue');
    return;
  }

  const key = `${QUEUE_PREFIX}${queueName}`;
  const taskData = JSON.stringify({
    ...task,
    enqueuedAt: new Date().toISOString(),
    priority: task.priority || 0,
  });

  // Use sorted set with priority as score
  await client.zAdd(key, {
    score: -(task.priority || 0), // Negative for descending order (higher priority first)
    value: taskData,
  });

  console.log(`[Queue] Enqueued ${task.type} to ${queueName}`);
}

/**
 * Get next task from queue
 */
export async function dequeue<T>(queueName: string): Promise<{
  id: string;
  type: string;
  payload: T;
} | null> {
  const client = getClient();
  if (!client) return null;

  const key = `${QUEUE_PREFIX}${queueName}`;

  // Get highest priority task
  const result = await client.zPopMax(key);
  if (!result) return null;

  const task = JSON.parse(result.value);
  const processingKey = `${PROCESSING_PREFIX}${queueName}:${task.id}`;

  // Move to processing set with TTL
  await client.set(processingKey, JSON.stringify({
    ...task,
    processingSince: new Date().toISOString(),
  }), { EX: 3600 }); // 1 hour TTL

  return task;
}

/**
 * Mark task as completed
 */
export async function complete<T>(queueName: string, taskId: string, result?: T): Promise<void> {
  const client = getClient();
  if (!client) return;

  const processingKey = `${PROCESSING_PREFIX}${queueName}:${taskId}`;
  await client.del(processingKey);

  console.log(`[Queue] Completed ${taskId} in ${queueName}`);
}

/**
 * Mark task as failed
 */
export async function fail<T>(queueName: string, taskId: string, error: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const processingKey = `${PROCESSING_PREFIX}${queueName}:${taskId}`;
  await client.del(processingKey);

  // Re-queue with delay for retry
  const taskData = await client.get(processingKey.replace(':processing:', ':queue:'));
  if (taskData && typeof taskData === 'string') {
    try {
      const parsed = JSON.parse(taskData);
      const task = parsed as { retryCount?: number; lastError?: string; id: string; type: string; payload: unknown };
      task.retryCount = (task.retryCount || 0) + 1;
      task.lastError = error;

      if (task.retryCount < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, task.retryCount) * 1000;
        setTimeout(() => enqueue(queueName, {
          id: task.id,
          type: task.type,
          payload: task.payload,
        }), delay);
      }
    } catch {
      // Ignore parse errors
    }
  }

  console.log(`[Queue] Failed ${taskId} in ${queueName}: ${error}`);
}

/**
 * Get queue length
 */
export async function getQueueLength(queueName: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;

  const key = `${QUEUE_PREFIX}${queueName}`;
  return await client.zCard(key);
}

/**
 * Get processing count
 */
export async function getProcessingCount(queueName: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;

  const keys = await client.keys(`${PROCESSING_PREFIX}${queueName}:*`);
  return keys.length;
}

/**
 * Close queue connection
 */
export async function closeQueue(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Queue] Connection closed');
  }
}

export default {
  initializeQueue,
  enqueue,
  dequeue,
  complete,
  fail,
  getQueueLength,
  getProcessingCount,
  closeQueue,
};
