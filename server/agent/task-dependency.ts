/**
 * Task Dependency Manager
 * Manages task dependencies and execution order
 */

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  blocking?: string[]; // Tasks this task blocks
}

export interface TaskExecution {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  dependsOnMet: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

// Task dependency definitions
const TASK_DEPENDENCIES: Record<string, TaskDependency> = {
  'rss-collector': {
    taskId: 'rss-collector',
    dependsOn: [],
  },
  'report-tech': {
    taskId: 'report-tech',
    dependsOn: ['rss-collector'],
    blocking: [],
  },
  'report-world': {
    taskId: 'report-world',
    dependsOn: ['rss-collector'],
    blocking: [],
  },
  'report-weekly': {
    taskId: 'report-weekly',
    dependsOn: ['rss-collector', 'report-tech', 'report-world'],
    blocking: [],
  },
  'tts-tech': {
    taskId: 'tts-tech',
    dependsOn: ['report-tech'],
  },
  'tts-world': {
    taskId: 'tts-world',
    dependsOn: ['report-world'],
  },
  'cleanup': {
    taskId: 'cleanup',
    dependsOn: [],
  },
  'backup': {
    taskId: 'backup',
    dependsOn: [],
  },
};

// In-memory execution tracking
const executionStatus = new Map<string, TaskExecution>();

/**
 * Get task dependency
 */
export function getTaskDependency(taskId: string): TaskDependency | null {
  return TASK_DEPENDENCIES[taskId] || null;
}

/**
 * Check if all dependencies are met
 */
export function checkDependencies(taskId: string): { met: boolean; missing: string[] } {
  const dependency = TASK_DEPENDENCIES[taskId];

  if (!dependency) {
    return { met: true, missing: [] }; // No dependencies = can run
  }

  const missing: string[] = [];

  for (const dep of dependency.dependsOn) {
    const status = executionStatus.get(dep);

    if (!status || status.status !== 'completed') {
      missing.push(dep);
    }
  }

  return {
    met: missing.length === 0,
    missing,
  };
}

/**
 * Mark task as started
 */
export function markStarted(taskId: string): void {
  executionStatus.set(taskId, {
    taskId,
    status: 'running',
    dependsOnMet: true,
    startedAt: new Date(),
  });
}

/**
 * Mark task as completed
 */
export function markCompleted(taskId: string): void {
  const existing = executionStatus.get(taskId);
  executionStatus.set(taskId, {
    taskId,
    status: 'completed',
    dependsOnMet: true,
    startedAt: existing?.startedAt,
    completedAt: new Date(),
  });
}

/**
 * Mark task as failed
 */
export function markFailed(taskId: string, error?: string): void {
  const existing = executionStatus.get(taskId);
  executionStatus.set(taskId, {
    taskId,
    status: 'failed',
    dependsOnMet: true,
    startedAt: existing?.startedAt,
    completedAt: new Date(),
  });
}

/**
 * Check if task can run
 */
export function canRun(taskId: string): { canRun: boolean; reason?: string } {
  const check = checkDependencies(taskId);

  if (!check.met) {
    return {
      canRun: false,
      reason: `Waiting for: ${check.missing.join(', ')}`,
    };
  }

  return { canRun: true };
}

/**
 * Get execution status for a task
 */
export function getStatus(taskId: string): TaskExecution | undefined {
  return executionStatus.get(taskId);
}

/**
 * Get all execution statuses
 */
export function getAllStatuses(): TaskExecution[] {
  return Array.from(executionStatus.values());
}

/**
 * Reset execution status (for testing)
 */
export function resetStatus(): void {
  executionStatus.clear();
}

/**
 * Add custom dependency
 */
export function addDependency(taskId: string, dependsOn: string[]): void {
  TASK_DEPENDENCIES[taskId] = {
    taskId,
    dependsOn,
  };
}

export default {
  getTaskDependency,
  checkDependencies,
  markStarted,
  markCompleted,
  markFailed,
  canRun,
  getStatus,
  getAllStatuses,
  resetStatus,
  addDependency,
};
