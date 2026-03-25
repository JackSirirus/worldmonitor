/**
 * Tech Events API - Conference and tech events
 * Converts Vercel Edge Function to Express route
 */

import express from 'express';

const router = express.Router();

const ICS_URL = 'https://www.techmeme.com/newsy_events.ics';
const DEV_EVENTS_RSS = 'https://dev.events/rss.xml';

// Major curated tech conferences
const CURATED_EVENTS = [
  { name: 'CES', startDate: '2026-01-06', endDate: '2026-01-09', location: 'Las Vegas, NV', url: 'https://www.ces.tech/', type: 'conference', source: 'curated' },
  { name: 'Web Summit', startDate: '2026-03-01', endDate: '2026-03-04', location: 'Lisbon, Portugal', url: 'https://websummit.com/', type: 'conference', source: 'curated' },
  { name: 'NVIDIA GTC', startDate: '2026-03-16', endDate: '2026-03-19', location: 'San Jose, CA', url: 'https://www.nvidia.com/gtc/', type: 'conference', source: 'curated' },
  { name: 'Microsoft Build', startDate: '2026-05-01', endDate: '2026-05-03', location: 'Seattle, WA', url: 'https://build.microsoft.com/', type: 'conference', source: 'curated' },
  { name: 'Apple WWDC', startDate: '2026-06-15', endDate: '2026-06-19', location: 'Cupertino, CA', url: 'https://developer.apple.com/wwdc/', type: 'conference', source: 'curated' },
  { name: 'Google I/O', startDate: '2026-05-20', endDate: '2026-05-21', location: 'Mountain View, CA', url: 'https://io.google/', type: 'conference', source: 'curated' },
];

function parseICS(text) {
  // Simplified ICS parser - extracts basic event info
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');

  for (const block of blocks) {
    if (!block.includes('DTSTART')) continue;

    const dtStart = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
    const dtEnd = block.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);
    const summary = block.match(/SUMMARY:(.+)/);
    const location = block.match(/LOCATION:(.+)/);
    const url = block.match(/URL:(.+)/);

    if (dtStart && summary) {
      const startDate = `${dtStart[1].slice(0,4)}-${dtStart[1].slice(4,6)}-${dtStart[1].slice(6,8)}`;
      const endDate = dtEnd ? `${dtEnd[1].slice(0,4)}-${dtEnd[1].slice(4,6)}-${dtEnd[1].slice(6,8)}` : startDate;

      events.push({
        name: summary[1].trim(),
        startDate,
        endDate,
        location: location ? location[1].trim() : '',
        url: url ? url[1].trim() : '',
        type: 'conference',
        source: 'techmeme',
      });
    }
  }
  return events;
}

function parseDevEventsRSS(text) {
  // Simplified RSS parser
  const events = [];
  const items = text.split('<item>');

  for (const item of items) {
    const title = item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>|<title>(.+?)<\/title>/);
    const link = item.match(/<link>(.+?)<\/link>/);
    const pubDate = item.match(/<pubDate>(.+?)<\/pubDate>/);

    if (title) {
      events.push({
        name: (title[1] || title[2] || '').trim(),
        startDate: pubDate ? new Date(pubDate[1]).toISOString().split('T')[0] : '',
        endDate: '',
        location: '',
        url: link ? link[1].trim() : '',
        type: 'conference',
        source: 'dev.events',
      });
    }
  }
  return events;
}

router.get('/', async (req, res) => {
  const { type, mappable, limit, days } = req.query;

  try {
    const [icsResponse, rssResponse] = await Promise.allSettled([
      fetch(ICS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorldMonitor/1.0)' } }),
      fetch(DEV_EVENTS_RSS, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorldMonitor/1.0)' } }),
    ]);

    let events = [];

    if (icsResponse.status === 'fulfilled' && icsResponse.value.ok) {
      const icsText = await icsResponse.value.text();
      events.push(...parseICS(icsText));
    }

    if (rssResponse.status === 'fulfilled' && rssResponse.value.ok) {
      const rssText = await rssResponse.value.text();
      events.push(...parseDevEventsRSS(rssText));
    }

    // Add curated events
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (const curated of CURATED_EVENTS) {
      const eventDate = new Date(curated.startDate);
      if (eventDate >= now) {
        events.push(curated);
      }
    }

    // Filter by mappable
    let filtered = events;
    if (mappable === 'true') {
      filtered = events.filter(e => e.location && e.location.length > 0);
    }

    // Filter by days
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + parseInt(days as string));
      filtered = filtered.filter(e => new Date(e.startDate) <= cutoff);
    }

    // Apply limit
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit as string));
    }

    res.json({
      events: filtered,
      total: filtered.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TechEvents] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch tech events', message: error.message });
  }
});

export { router };
