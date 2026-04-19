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
 * List all reports with pagination and optional language filter
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const lang = req.query.lang as string | undefined;

    let sql = 'SELECT id, title, format, category, period_start, period_end, created_at FROM reports';
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    if (lang) {
      // Filter by language suffix in title
      // zh reports have Chinese title, en reports have English title
      if (lang === 'zh') {
        conditions.push(`title LIKE '%简报%' OR title LIKE '%每日%' OR title LIKE '%趋势%' OR title LIKE '%周%'`);
      } else {
        conditions.push(`title LIKE '%Brief%' OR title LIKE '%Daily%' OR title LIKE '%Weekly%' OR title LIKE '%Trend%'`);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';
    if (conditions.length > 0) {
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    } else {
      sql += ` LIMIT $1 OFFSET $2`;
    }
    params.push(limit, offset);

    const result = await query<Report>(sql, params);

    let countSql = 'SELECT COUNT(*) as count FROM reports';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await query<{ count: string }>(countSql, category ? [category] : []);

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

    // Always return as JSON - frontend expects JSON
    res.json(report);
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
 * Trigger report generation (supports bilingual generation)
 */
router.post('/generate', async (req, res) => {
  try {
    const { type, bilingual } = req.body;
    const reportType = type === 'weekly' ? 'weekly-trend' : 'daily-summary';

    logger.info({ type: reportType, bilingual }, '[Reports API] Triggering report generation');

    if (bilingual) {
      // Generate bilingual reports directly via overload
      const { generateDailySummary, generateWeeklyTrendBilingual } = await import('../agent/report-generator.js');

      if (reportType === 'weekly-trend') {
        const result = await generateWeeklyTrendBilingual();
        res.json({
          success: true,
          bilingual: true,
          message: 'Weekly trend report generation triggered (bilingual)',
          reports: {
            zh: result.zh ? { id: result.zh.id, title: result.zh.title } : null,
            en: result.en ? { id: result.en.id, title: result.en.title } : null,
          },
        });
      } else {
        // Use overload to get bilingual result
        const result = await generateDailySummary('zh', true) as { zh: any[]; en: any[] };
        res.json({
          success: true,
          bilingual: true,
          message: 'Daily report generation triggered (bilingual)',
          reports: {
            zh: result.zh.map((r: any) => ({ id: r.id, title: r.title, category: r.category })),
            en: result.en.map((r: any) => ({ id: r.id, title: r.title, category: r.category })),
          },
        });
      }
    } else {
      // Run the scheduled task
      await triggerTask(reportType);
      res.json({
        success: true,
        message: `${reportType} report generation triggered`,
      });
    }
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
 * Query param: lang=zh|en (default: zh)
 */
router.post('/generate/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const lang = (req.query.lang as string) || 'zh';

    const validCategories = ['tech', 'world', 'daily', 'weekly'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories,
      });
    }

    if (lang !== 'zh' && lang !== 'en') {
      return res.status(400).json({
        error: 'Invalid language',
        validLanguages: ['zh', 'en'],
      });
    }

    logger.info({ category, lang }, '[Reports API] Generating category report');

    const { generateReport } = await import('../agent/report-generator.js');
    const report = await generateReport(category as any, lang as any);

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
