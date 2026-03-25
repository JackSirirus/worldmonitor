/**
 * Story Page for Social Crawlers
 * Returns HTML with proper og:image and twitter:card meta tags
 */

import express from 'express';

const router = express.Router();

const COUNTRY_NAMES: Record<string, string> = {
  UA: 'Ukraine', RU: 'Russia', CN: 'China', US: 'United States',
  IR: 'Iran', IL: 'Israel', TW: 'Taiwan', KP: 'North Korea',
  SA: 'Saudi Arabia', TR: 'Turkey', PL: 'Poland', DE: 'Germany',
  FR: 'France', GB: 'United Kingdom', IN: 'India', PK: 'Pakistan',
  SY: 'Syria', YE: 'Yemen', MM: 'Myanmar', VE: 'Venezuela',
};

const BOT_UA = /twitterbot|facebookexternalhit|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|redditbot|googlebot/i;

function esc(str: string) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

router.get('/', (req, res) => {
  const countryCode = (req.query.c as string || '').toUpperCase();
  const type = req.query.t as string || 'ciianalysis';
  const ts = req.query.ts as string || '';
  const score = req.query.s as string || '';
  const level = req.query.l as string || '';

  const ua = req.headers['user-agent'] || '';
  const isBot = BOT_UA.test(ua);

  const baseUrl = `https://${req.headers.host}`;
  const spaUrl = `${baseUrl}/?c=${countryCode}&t=${type}${ts ? `&ts=${ts}` : ''}`;

  if (!isBot) {
    return res.redirect(302, spaUrl);
  }

  const countryName = COUNTRY_NAMES[countryCode] || countryCode || 'Global';
  const title = `${countryName} Intelligence Brief | World Monitor`;
  const description = `Real-time instability analysis for ${countryName}. Country Instability Index, military posture, threat classification, and prediction markets. Free, open-source geopolitical intelligence.`;
  const imageParams = `c=${countryCode}&t=${type}${score ? `&s=${score}` : ''}${level ? `&l=${level}` : ''}`;
  const imageUrl = `${baseUrl}/api/og-story?${imageParams}`;
  const storyUrl = `${baseUrl}/api/story?c=${countryCode}&t=${type}${ts ? `&ts=${ts}` : ''}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:image" content="${esc(imageUrl)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${esc(storyUrl)}"/>
  <meta property="og:site_name" content="World Monitor"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:site" content="@WorldMonitorApp"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(description)}"/>
  <meta name="twitter:image" content="${esc(imageUrl)}"/>
  <link rel="canonical" href="${esc(storyUrl)}"/>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <p><a href="${esc(spaUrl)}">View live analysis</a></p>
</body>
</html>`;

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).send(html);
});

export { router };
