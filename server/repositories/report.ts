/**
 * Report Repository
 * Handles data access for reports table
 */

import { query } from '../database/connection.js';

export interface Report {
  id: number;
  title: string;
  content: string;
  format: string;
  category: string | null;
  period_start: Date | null;
  period_end: Date | null;
  task_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReportFilters {
  category?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Get paginated reports
 */
export async function getReports(
  filters: ReportFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ items: Report[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(filters.category);
  }

  if (filters.fromDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.toDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (pagination.page - 1) * pagination.limit;

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM reports ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get items
  const itemsResult = await query<Report>(
    `SELECT * FROM reports ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, pagination.limit, offset]
  );

  return {
    items: itemsResult.rows,
    total,
  };
}

/**
 * Get report by ID
 */
export async function getReportById(id: number): Promise<Report | null> {
  const result = await query<Report>(
    'SELECT * FROM reports WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new report
 */
export async function createReport(report: {
  title: string;
  content: string;
  format?: string;
  category?: string;
  period_start?: Date;
  period_end?: Date;
  task_id?: number;
}): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO reports (title, content, format, category, period_start, period_end, task_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      report.title,
      report.content,
      report.format || 'markdown',
      report.category || null,
      report.period_start || null,
      report.period_end || null,
      report.task_id || null,
    ]
  );
  return result.rows[0].id;
}

/**
 * Update a report
 */
export async function updateReport(
  id: number,
  updates: Partial<Pick<Report, 'title' | 'content' | 'category'>>
): Promise<boolean> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    params.push(updates.title);
  }

  if (updates.content !== undefined) {
    fields.push(`content = $${paramIndex++}`);
    params.push(updates.content);
  }

  if (updates.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    params.push(updates.category);
  }

  if (fields.length === 0) return false;

  params.push(id);

  const result = await query(
    `UPDATE reports SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    params
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Delete a report
 */
export async function deleteReport(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM reports WHERE id = $1',
    [id]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Get latest reports
 */
export async function getLatestReports(limit: number = 10): Promise<Report[]> {
  const result = await query<Report>(
    'SELECT * FROM reports ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

/**
 * Delete reports older than specified date
 */
export async function deleteOldReports(olderThan: Date): Promise<number> {
  const result = await query<{ count: string }>(
    'DELETE FROM reports WHERE created_at < $1 RETURNING COUNT(*) as count',
    [olderThan]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get distinct report categories
 */
export async function getReportCategories(): Promise<string[]> {
  const result = await query<{ category: string }>(
    'SELECT DISTINCT category FROM reports WHERE category IS NOT NULL ORDER BY category'
  );
  return result.rows.map(r => r.category);
}

export default {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getLatestReports,
  deleteOldReports,
  getReportCategories,
};
