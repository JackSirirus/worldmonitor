/**
 * Tool Policy Pipeline
 * Multi-layer policy enforcement for tool execution
 */

import { isLocked } from './task-lock.js';
import { warn, error } from './task-logger.js';

export type ToolType = 'rss-fetch' | 'web-search' | 'ai-summarize' | 'tts-generate' | 'report-generate';
export type Role = 'system' | 'scheduled' | 'manual';

export interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

export interface LoopDetectionConfig {
  maxRepeats: number;
  windowMs: number;
}

export interface ToolPolicy {
  allowedRoles: Role[];
  rateLimit?: RateLimitConfig;
  loopDetection?: LoopDetectionConfig;
}

// Rate limiting state (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const loopDetectionStore = new Map<string, { calls: string[]; timestamp: number }>();

/**
 * Tool definitions with policies
 */
export const TOOL_POLICIES: Record<ToolType, ToolPolicy> = {
  'rss-fetch': {
    allowedRoles: ['system', 'scheduled'],
    rateLimit: { maxCalls: 100, windowMs: 60000 }, // 100 calls per minute
    loopDetection: { maxRepeats: 5, windowMs: 300000 },
  },
  'web-search': {
    allowedRoles: ['system', 'scheduled'],
    rateLimit: { maxCalls: 10, windowMs: 60000 }, // 10 searches per minute
    loopDetection: { maxRepeats: 3, windowMs: 300000 },
  },
  'ai-summarize': {
    allowedRoles: ['system', 'scheduled', 'manual'],
    rateLimit: { maxCalls: 50, windowMs: 60000 },
  },
  'tts-generate': {
    allowedRoles: ['system', 'scheduled'],
    rateLimit: { maxCalls: 10, windowMs: 60000 },
  },
  'report-generate': {
    allowedRoles: ['system', 'scheduled', 'manual'],
  },
};

/**
 * Check if role is allowed for tool
 */
export function checkPermission(tool: ToolType, role: Role): boolean {
  const policy = TOOL_POLICIES[tool];
  return policy.allowedRoles.includes(role);
}

/**
 * Check rate limit for tool
 */
export function checkRateLimit(tool: ToolType): boolean {
  const policy = TOOL_POLICIES[tool];
  if (!policy.rateLimit) return true;

  const key = tool;
  const now = Date.now();
  const { maxCalls, windowMs } = policy.rateLimit;

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxCalls) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Check for loop detection
 */
export function checkLoopDetection(sessionId: string, tool: ToolType): boolean {
  const policy = TOOL_POLICIES[tool];
  if (!policy.loopDetection) return true;

  const key = `${sessionId}:${tool}`;
  const now = Date.now();
  const { maxRepeats, windowMs } = policy.loopDetection;

  const current = loopDetectionStore.get(key);

  if (!current || current.timestamp < now - windowMs) {
    loopDetectionStore.set(key, { calls: [now.toString()], timestamp: now });
    return true;
  }

  // Check if we've exceeded max repeats
  if (current.calls.length >= maxRepeats) {
    return false;
  }

  current.calls.push(now.toString());
  return true;
}

/**
 * Execute tool with policy enforcement
 */
export async function executeWithPolicy<T>(
  tool: ToolType,
  role: Role,
  sessionId: string,
  handler: () => Promise<T>
): Promise<T> {
  // 1. Permission check
  if (!checkPermission(tool, role)) {
    throw new PolicyViolationError(`Role ${role} not allowed for tool ${tool}`);
  }

  // 2. Rate limit check
  if (!checkRateLimit(tool)) {
    warn(tool, sessionId, `Rate limit exceeded for ${tool}`);
    throw new RateLimitError(`Rate limit exceeded for ${tool}`);
  }

  // 3. Loop detection
  if (!checkLoopDetection(sessionId, tool)) {
    warn(tool, sessionId, `Loop detected for ${tool}`);
    throw new LoopDetectionError(`Loop detected for ${tool}`);
  }

  // 4. Execute
  return await handler();
}

/**
 * Custom errors
 */
export class PolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyViolationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class LoopDetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoopDetectionError';
  }
}

export default {
  TOOL_POLICIES,
  checkPermission,
  checkRateLimit,
  checkLoopDetection,
  executeWithPolicy,
  PolicyViolationError,
  RateLimitError,
  LoopDetectionError,
};
