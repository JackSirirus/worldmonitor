/**
 * FAA Status API
 * Fetches FAA airport status information
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://nasstatus.faa.gov/api/airport-status-information', {
      headers: { 'Accept': 'application/xml' },
    });
    const data = await response.text();
    return res.status(response.status).set({ 'Content-Type': 'application/xml' }).send(data);
  } catch (error: any) {
    return res.status(500).set({ 'Content-Type': 'application/xml' }).send(`<error>${error.message}</error>`);
  }
});

export { router };
