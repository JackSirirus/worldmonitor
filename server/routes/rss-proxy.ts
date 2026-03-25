/**
 * RSS Proxy API
 * Proxies RSS feeds with security allowlist
 */

import express from 'express';

const router = express.Router();

const ALLOWED_DOMAINS = [
  'feeds.bbci.co.uk',
  'www.theguardian.com',
  'feeds.npr.org',
  'news.google.com',
  'www.aljazeera.com',
  'rss.cnn.com',
  'hnrss.org',
  'feeds.arstechnica.com',
  'www.theverge.com',
  'www.cnbc.com',
  'feeds.marketwatch.com',
  'www.defenseone.com',
  'breakingdefense.com',
  'www.bellingcat.com',
  'techcrunch.com',
  'huggingface.co',
  'www.technologyreview.com',
  'rss.arxiv.org',
  'export.arxiv.org',
  'www.federalreserve.gov',
  'www.sec.gov',
  'www.whitehouse.gov',
  'www.state.gov',
  'www.defense.gov',
  'home.treasury.gov',
  'www.justice.gov',
  'tools.cdc.gov',
  'www.fema.gov',
  'www.dhs.gov',
  'www.thedrive.com',
  'krebsonsecurity.com',
  'finance.yahoo.com',
  'thediplomat.com',
  'venturebeat.com',
  'foreignpolicy.com',
  'www.ft.com',
  'openai.com',
  'www.reutersagency.com',
  'feeds.reuters.com',
  'rsshub.app',
  'www.cfr.org',
  'www.csis.org',
  'www.politico.com',
  'www.brookings.edu',
  'layoffs.fyi',
  'www.defensenews.com',
  'www.foreignaffairs.com',
  'www.atlanticcouncil.org',
  // Tech variant domains
  'www.zdnet.com',
  'www.techmeme.com',
  'www.darkreading.com',
  'www.schneier.com',
  'rss.politico.com',
  'www.anandtech.com',
  'www.tomshardware.com',
  'www.semianalysis.com',
  'feed.infoq.com',
  'thenewstack.io',
  'devops.com',
  'dev.to',
  'lobste.rs',
  'changelog.com',
  'seekingalpha.com',
  // Additional domains
  'www.ycombinator.com',
  'www.coindesk.com',
  'bitcoinmagazine.com',
  'www.carnegieendowment.org',
  'www.rand.org',
  'www.iai.org',
  'www.crisisgroup.org',
  'www.who.int',
  'www.iaea.org',
  'www.un.org',
  'news.un.org',
  'www.cisa.gov',
  // Regional feeds
  'www.eu-startups.com',
  'tech.eu',
  'sifted.eu',
  'www.techinasia.com',
  'inc42.com',
  'yourstory.com',
  'techcabal.com',
  'lavca.org',
  // More sources
  'www.theinformation.com',
  'www.cbinsights.com',
  'www.saastr.com',
  'lennysnewsletter.com',
  'stratechery.com',
  // China/Asia sources
  'www.scmp.com',
  'www.nikkei.com',
  // Other
  'www.engadget.com',
  'fastcompany.com',
  'www.fortune.com',
  // Podcast feeds
  'podcasts.apple.com',
  'feeds.simplecast.com',
  // GitHub
  'github.blog',
  'mshibanami.github.io',
  // News24
  'feeds.capi24.com',
];

function isAllowedDomain(url) {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(d => urlObj.hostname === d || urlObj.hostname.endsWith('.' + d));
  } catch { return false; }
}

router.get('/', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url parameter required' });
  if (!isAllowedDomain(url)) return res.status(403).json({ error: 'Domain not allowed' });

  try {
    console.log('[RSS Proxy] Fetching:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorldMonitor/1.0)', 'Accept': 'application/rss+xml, application/xml, text/xml' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const text = await response.text();
    res.set({
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    }).send(text);
  } catch (error) {
    console.error('[RSS Proxy] Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feed', details: error instanceof Error ? error.message : String(error) });
  }
});

export { router };
