/**
 * Temporal Baseline Anomaly Detection API
 * Stores and queries activity baselines using Welford's online algorithm
 * Backed by Upstash Redis for cross-user persistence
 *
 * GET ?type=military_flights&region=global&count=47 — check anomaly
 * POST { updates: [{ type, region, count }] } — batch update baselines
 */

import express from 'express';
import { getRedis } from '../utils/upstash.js';

const router = express.Router();

const BASELINE_TTL = 7776000; // 90 days in seconds
const MIN_SAMPLES = 10;
const Z_THRESHOLD_LOW = 1.5;
const Z_THRESHOLD_MEDIUM = 2.0;
const Z_THRESHOLD_HIGH = 3.0;

const VALID_TYPES = ['military_flights', 'vessels', 'protests', 'news', 'ais_gaps', 'satellite_fires'];

function makeKey(type: string, region: string, weekday: number, month: number): string {
  return `baseline:${type}:${region}:${weekday}:${month}`;
}

function getSeverity(zScore: number): string {
  if (zScore >= Z_THRESHOLD_HIGH) return 'critical';
  if (zScore >= Z_THRESHOLD_MEDIUM) return 'high';
  if (zScore >= Z_THRESHOLD_LOW) return 'medium';
  return 'normal';
}

interface BaselineData {
  mean: number;
  m2: number;
  sampleCount: number;
  lastUpdated?: string;
}

router.get('/', async (req, res) => {
  const r = getRedis();
  if (!r) {
    return res.status(503).json({ error: 'Redis not configured' });
  }

  try {
    const type = req.query.type as string;
    const region = (req.query.region as string) || 'global';
    const count = parseFloat(req.query.count as string);

    if (!type || !VALID_TYPES.includes(type) || isNaN(count)) {
      return res.status(400).json({ error: 'Missing or invalid params: type, count required' });
    }

    const now = new Date();
    const weekday = now.getUTCDay();
    const month = now.getUTCMonth() + 1;
    const key = makeKey(type, region, weekday, month);

    const baseline = await r.get(key) as BaselineData | null;

    if (!baseline || baseline.sampleCount < MIN_SAMPLES) {
      return res.json({
        anomaly: null,
        learning: true,
        sampleCount: baseline?.sampleCount || 0,
        samplesNeeded: MIN_SAMPLES,
      });
    }

    const variance = Math.max(0, baseline.m2 / (baseline.sampleCount - 1));
    const stdDev = Math.sqrt(variance);
    const zScore = stdDev > 0 ? Math.abs((count - baseline.mean) / stdDev) : 0;
    const severity = getSeverity(zScore);
    const multiplier = baseline.mean > 0
      ? Math.round((count / baseline.mean) * 100) / 100
      : count > 0 ? 999 : 1;

    return res.json({
      anomaly: zScore >= Z_THRESHOLD_LOW ? {
        zScore: Math.round(zScore * 100) / 100,
        severity,
        multiplier,
      } : null,
      baseline: {
        mean: Math.round(baseline.mean * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        sampleCount: baseline.sampleCount,
      },
      learning: false,
    });
  } catch (err: any) {
    console.error('[TemporalBaseline] Error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/', async (req, res) => {
  const r = getRedis();
  if (!r) {
    return res.status(503).json({ error: 'Redis not configured' });
  }

  try {
    const updates = req.body?.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Body must have updates array' });
    }

    // Cap batch size
    const batch = updates.slice(0, 20);
    const now = new Date();
    const weekday = now.getUTCDay();
    const month = now.getUTCMonth() + 1;

    // Read all existing baselines
    const keys = batch.map((u: any) => makeKey(u.type, u.region || 'global', weekday, month));
    const existing = await r.mget(...keys) as (BaselineData | null)[];

    // Compute Welford updates and pipeline writes
    const pipeline = r.pipeline();
    let updated = 0;

    for (let i = 0; i < batch.length; i++) {
      const { type, region = 'global', count } = batch[i];
      if (!VALID_TYPES.includes(type) || typeof count !== 'number' || isNaN(count)) continue;

      const prev = existing[i] || { mean: 0, m2: 0, sampleCount: 0 };

      // Welford's online algorithm
      const n = prev.sampleCount + 1;
      const delta = count - prev.mean;
      const newMean = prev.mean + delta / n;
      const delta2 = count - newMean;
      const newM2 = prev.m2 + delta * delta2;

      pipeline.set(keys[i], {
        mean: newMean,
        m2: newM2,
        sampleCount: n,
        lastUpdated: now.toISOString(),
      }, { ex: BASELINE_TTL });

      updated++;
    }

    if (updated > 0) {
      await pipeline.exec();
    }

    return res.json({ updated });
  } catch (err: any) {
    console.error('[TemporalBaseline] Error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export { router };
