/**
 * Tool Repository
 * Handles data access for agent_jobs table (tool configurations)
 */

import { query, transaction } from '../database/connection.js';

export interface AgentJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  execution_mode: 'isolated' | 'mainSession';
  payload: Record<string, unknown>;
  max_concurrent: number;
  timeout: number;
  retry_policy: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface JobFilters {
  enabled?: boolean;
  executionMode?: string;
}

/**
 * Get all jobs
 */
export async function getJobs(filters: JobFilters = {}): Promise<AgentJob[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.enabled !== undefined) {
    conditions.push(`enabled = $${paramIndex++}`);
    params.push(filters.enabled);
  }

  if (filters.executionMode) {
    conditions.push(`execution_mode = $${paramIndex++}`);
    params.push(filters.executionMode);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query<AgentJob>(
    `SELECT * FROM agent_jobs ${whereClause} ORDER BY name ASC`,
    params
  );
  return result.rows;
}

/**
 * Get job by ID
 */
export async function getJobById(id: string): Promise<AgentJob | null> {
  const result = await query<AgentJob>(
    'SELECT * FROM agent_jobs WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get enabled jobs
 */
export async function getEnabledJobs(): Promise<AgentJob[]> {
  const result = await query<AgentJob>(
    'SELECT * FROM agent_jobs WHERE enabled = true ORDER BY name ASC'
  );
  return result.rows;
}

/**
 * Create a new job
 */
/**
 * Seed default job configurations if they don't exist
 */
export async function seedDefaultJobs(): Promise<void> {
  const defaultJobs = [
    {
      id: 'rss-collector',
      name: 'RSS Collector',
      schedule: '*/30 * * * *',
      payload: {},
    },
    {
      id: 'report-tech',
      name: 'Tech Report Generator',
      schedule: '0 6 * * *',
      payload: { category: 'tech' },
    },
    {
      id: 'report-world',
      name: 'World Report Generator',
      schedule: '0 7 * * *',
      payload: { category: 'world' },
    },
    {
      id: 'cleanup',
      name: 'Cleanup Agent',
      schedule: '0 4 * * *',
      payload: {},
    },
    {
      id: 'backup',
      name: 'Backup Agent',
      schedule: '0 3 * * *',
      payload: {},
    },
    {
      id: 'clustering',
      name: 'News Clustering',
      schedule: '*/15 * * * *',
      payload: {},
    },
  ];

  for (const job of defaultJobs) {
    // Check if job already exists
    const existing = await query(
      'SELECT id FROM agent_jobs WHERE id = $1',
      [job.id]
    );

    if (existing.rows.length === 0) {
      await createJob({
        id: job.id,
        name: job.name,
        schedule: job.schedule,
        payload: job.payload,
      });
      console.log(`[Seed] Created default job: ${job.id}`);
    }
  }
  console.log('[Seed] Default jobs seeded successfully');
}

export async function createJob(job: {
  id: string;
  name: string;
  schedule: string;
  payload: Record<string, unknown>;
  executionMode?: 'isolated' | 'mainSession';
  maxConcurrent?: number;
  timeout?: number;
  retryPolicy?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO agent_jobs (id, name, schedule, enabled, execution_mode, payload, max_concurrent, timeout, retry_policy)
     VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8)`,
    [
      job.id,
      job.name,
      job.schedule,
      job.executionMode || 'isolated',
      job.payload,
      job.maxConcurrent || 1,
      job.timeout || 300000,
      job.retryPolicy || null,
    ]
  );
}

/**
 * Update a job
 */
export async function updateJob(
  id: string,
  updates: Partial<Pick<AgentJob, 'name' | 'schedule' | 'enabled' | 'execution_mode' | 'payload' | 'max_concurrent' | 'timeout' | 'retry_policy'>>
): Promise<boolean> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(updates.name);
  }

  if (updates.schedule !== undefined) {
    fields.push(`schedule = $${paramIndex++}`);
    params.push(updates.schedule);
  }

  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramIndex++}`);
    params.push(updates.enabled);
  }

  if (updates.execution_mode !== undefined) {
    fields.push(`execution_mode = $${paramIndex++}`);
    params.push(updates.execution_mode);
  }

  if (updates.payload !== undefined) {
    fields.push(`payload = $${paramIndex++}`);
    params.push(updates.payload);
  }

  if (updates.max_concurrent !== undefined) {
    fields.push(`max_concurrent = $${paramIndex++}`);
    params.push(updates.max_concurrent);
  }

  if (updates.timeout !== undefined) {
    fields.push(`timeout = $${paramIndex++}`);
    params.push(updates.timeout);
  }

  if (updates.retry_policy !== undefined) {
    fields.push(`retry_policy = $${paramIndex++}`);
    params.push(updates.retry_policy);
  }

  if (fields.length === 0) return false;

  params.push(id);

  const result = await query(
    `UPDATE agent_jobs SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    params
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Delete a job
 */
export async function deleteJob(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM agent_jobs WHERE id = $1',
    [id]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Enable/disable a job
 */
export async function setJobEnabled(id: string, enabled: boolean): Promise<boolean> {
  const result = await query(
    'UPDATE agent_jobs SET enabled = $1 WHERE id = $2',
    [enabled, id]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Toggle job (enable if disabled, disable if enabled)
 */
export async function toggleJob(id: string): Promise<boolean | null> {
  const job = await getJobById(id);
  if (!job) return null;

  const newEnabled = !job.enabled;
  await setJobEnabled(id, newEnabled);
  return newEnabled;
}

/**
 * Job exists check
 */
export async function jobExists(id: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM agent_jobs WHERE id = $1',
    [id]
  );
  return parseInt(result.rows[0]?.count || '0', 10) > 0;
}

export default {
  getJobs,
  getJobById,
  getEnabledJobs,
  createJob,
  updateJob,
  deleteJob,
  setJobEnabled,
  toggleJob,
  jobExists,
};
