/**
 * NGA Warnings API
 * Fetches navigation warnings from NGA
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://msi.nga.mil/api/publications/broadcast-warn?output=json&status=A');
    const data = await response.text();
    return res.status(response.status).set({ 'Content-Type': 'application/json' }).send(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { router };
