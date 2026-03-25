/**
 * Reports API Routes
 * GET /api/reports - List all reports
 * GET /api/reports/:id - Get a specific report (Markdown)
 * POST /api/reports/generate - Trigger report generation
 */

import { Router } from 'express';
import { query } from '../database/connection.js';
import { triggerTask } from '../agent/scheduler.js';
import { logger } from '../utils/logger.js';

const router = Router();

export interface Report {
  id: number;
  title: string;
  content: string;
  format: string;
  category: string | null;
  period_start: Date | null;
  period_end: Date | null;
  created_at: Date;
}

/**
 * GET /api/reports
 * List all reports with pagination
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;

    let sql = 'SELECT id, title, format, category, period_start, period_end, created_at FROM reports';
    const params: (string | number)[] = [];

    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
      sql += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    } else {
      sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }

    const result = await query<Report>(sql, params);
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reports' + (category ? ' WHERE category = $1' : ''),
      category ? [category] : []
    );

    res.json({
      reports: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (error) {
    logger.error({ err: error }, '[Reports API] Error fetching reports');
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const result = await query<Report>(
      'SELECT * FROM reports WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Return as Markdown if format is markdown
    if (report.format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(report.content);
    } else {
      res.json(report);
    }
  } catch (error) {
    logger.error({ err: error }, '[Reports API] Error fetching report');
    res.status(500).json({
      error: 'Failed to fetch report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/reports/generate
 * Trigger report generation manually
 */
router.post('/generate', async (req, res) => {
  try {
    const { type } = req.body;
    const reportType = type === 'weekly' ? 'weekly-trend' : 'daily-summary';

    logger.info({ type: reportType }, '[Reports API] Triggering report generation');

    // Run the task
    await triggerTask(reportType);

    res.json({
      success: true,
      message: `${reportType} report generation triggered`,
    });
  } catch (error) {
    logger.error({ err: error }, '[Reports API] Error generating report');
    res.status(500).json({
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/reports/generate/:category
 * Generate a specific category report
 * Categories: tech, world, daily, weekly
 */
router.post('/generate/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const validCategories = ['tech', 'world', 'daily', 'weekly'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories,
      });
    }

    logger.info({ category }, '[Reports API] Generating category report');

    const { generateReport } = await import('../agent/report-generator.js');
    const report = await generateReport(category as any);

    if (report) {
      res.json({
        success: true,
        report: {
          id: report.id,
          title: report.title,
          category: report.category,
          created_at: report.created_at,
        },
      });
    } else {
      res.json({
        success: true,
        message: 'Report already exists or no data available',
      });
    }
  } catch (error) {
    logger.error({ err: error }, '[Reports API] Error generating category report');
    res.status(500).json({
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
