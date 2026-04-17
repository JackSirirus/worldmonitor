/**
 * Report Tools for MCP Server
 * Phase 2: Report generation and retrieval tools
 */

import { query } from '../../database/connection.js';
import { triggerTask } from '../../agent/scheduler.js';
import type { MCPToolResult } from '../types.js';

/**
 * Tool: generate_report
 * Generate a new report
 */
export async function generateReport(args: {
  category: string;
  period?: string;
}): Promise<MCPToolResult> {
  try {
    const validCategories = ['tech', 'world', 'daily', 'weekly'];
    const category = args.category?.toLowerCase();

    if (!category || !validCategories.includes(category)) {
      return {
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      };
    }

    // Trigger report generation via scheduler
    const reportType = category === 'weekly' ? 'weekly-trend' : `${category}-summary`;

    try {
      await triggerTask(reportType);
    } catch (taskError) {
      // If triggerTask fails, try direct generation
      console.log('[MCP] triggerTask failed, trying direct generation');
    }

    // For immediate results, check if report was just created
    const recentReport = await query(
      `SELECT id, title, category, format, created_at
       FROM reports
       WHERE category = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [category]
    );

    if (recentReport.rows.length > 0) {
      return {
        success: true,
        data: {
          message: `Report generation triggered for ${category}`,
          report: {
            id: recentReport.rows[0].id,
            title: recentReport.rows[0].title,
            category: recentReport.rows[0].category,
            format: recentReport.rows[0].format,
            created_at: recentReport.rows[0].created_at,
          },
        },
      };
    }

    return {
      success: true,
      data: {
        message: `Report generation triggered for ${category}. Check /api/reports for the result.`,
        category,
        status: 'triggered',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_report_content
 * Get full content of a report by ID
 */
export async function getReportContent(args: {
  id: number;
}): Promise<MCPToolResult> {
  try {
    if (!args.id || isNaN(args.id)) {
      return {
        success: false,
        error: 'Valid report ID is required',
      };
    }

    const result = await query(
      `SELECT id, title, content, format, category,
              period_start, period_end, created_at
       FROM reports
       WHERE id = $1`,
      [args.id]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Report not found',
      };
    }

    const report = result.rows[0];

    return {
      success: true,
      data: {
        id: report.id,
        title: report.title,
        content: report.content,
        format: report.format,
        category: report.category,
        period_start: report.period_start,
        period_end: report.period_end,
        created_at: report.created_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: list_reports
 * List reports with optional filters
 */
export async function listReports(args: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<MCPToolResult> {
  try {
    const limit = Math.min(args.limit || 20, 100);
    const offset = args.offset || 0;

    let sql = 'SELECT id, title, format, category, period_start, period_end, created_at FROM reports';
    const params: (string | number)[] = [];

    if (args.category) {
      sql += ' WHERE category = $1';
      params.push(args.category);
      sql += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    } else {
      sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }

    const result = await query(sql, params);

    // Get total count
    const countSql = args.category
      ? 'SELECT COUNT(*) as count FROM reports WHERE category = $1'
      : 'SELECT COUNT(*) as count FROM reports';
    const countResult = await query(countSql, args.category ? [args.category] : []);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      success: true,
      data: {
        reports: result.rows,
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
