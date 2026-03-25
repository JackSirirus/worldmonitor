/**
 * Cache Telemetry API
 * Returns in-memory cache statistics for monitoring
 */

import express from 'express';
import { getCacheTelemetrySnapshot } from '../utils/telemetry.js';

const router = express.Router();

router.get('/', (req, res) => {
  return res.json(getCacheTelemetrySnapshot());
});

export { router };
