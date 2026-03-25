/**
 * Cloudflare Outages API
 * Fetches internet outages data from Cloudflare Radar
 * Requires CLOUDFLARE_API_TOKEN environment variable
 */

import express from 'express';

const router = express.Router();

function clampLimit(rawLimit: string | undefined): number {
  const parsed = Number.parseInt(rawLimit || '', 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(100, parsed));
}

router.get('/', async (req, res) => {
  const dateRange = (req.query.dateRange as string) || '7d';
  const limit = clampLimit(req.query.limit as string);

  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    return res.status(200).json({ configured: false });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/radar/annotations/outages?dateRange=${dateRange}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.text();
    return res.status(response.status)
      .set({ 'Content-Type': 'application/json' })
      .send(data);
  } catch (error) {
    // Return empty result on error
    return res.status(200).json({ success: true, result: { annotations: [] } });
  }
});

export { router };
