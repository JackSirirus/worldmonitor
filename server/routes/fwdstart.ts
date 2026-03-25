/**
 * FwdStart Newsletter API - Scrapes archive page
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://www.fwdstart.me/archive', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const items = [];
    const seenUrls = new Set();

    const slideBlocks = html.split('embla__slide');

    for (const block of slideBlocks) {
      const urlMatch = block.match(/href="(\/p\/[^"]+)"/);
      if (!urlMatch) continue;

      const url = `https://www.fwdstart.me${urlMatch[1]}`;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      const altMatch = block.match(/alt="([^"]+)"/);
      const title = altMatch ? altMatch[1] : '';
      if (!title || title.length < 5) continue;

      const dateMatch = block.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
      let dateStr = new Date().toISOString();
      if (dateMatch) {
        try {
          dateStr = new Date(`${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`).toISOString();
        } catch {}
      }

      items.push({ title, url, date: dateStr });
    }

    // Return as RSS-like XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>FwdStart Newsletter</title>
<link>https://www.fwdstart.me/archive</link>
<description>FwdStart Newsletter Archive</description>
${items.map(item => `<item><title><![CDATA[${item.title}]]></title><link>${item.url}</link><pubDate>${item.date}</pubDate></item>`).join('\n')}
</channel>
</rss>`;

    res.set({
      'Content-Type': 'application/xml',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }).send(rss);
  } catch (error) {
    console.error('[FwdStart] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch FwdStart data', message: error.message });
  }
});

export { router };
