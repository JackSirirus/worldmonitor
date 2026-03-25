/**
 * Wingbits single aircraft details
 */

import express from 'express';

const router = express.Router();

router.get('/details/:icao24', async (req, res) => {
  const icao24 = req.params.icao24?.toLowerCase();
  const apiKey = process.env.WINGBITS_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'Wingbits not configured', configured: false });
  }

  if (!icao24 || !/^[a-f0-9]+$/i.test(icao24)) {
    return res.status(400).json({ error: 'Invalid icao24' });
  }

  try {
    const response = await fetch(`https://customer-api.wingbits.com/v1/flights/details/${icao24}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Wingbits API error: ${response.status}`, icao24 });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message, icao24 });
  }
});

export { router };
