/**
 * Stock Market Index Endpoint
 * Fetches weekly % change for a country's primary stock index via Yahoo Finance
 * Redis cached (1h TTL)
 */

import express from 'express';
import { getCachedJson, setCachedJson } from '../utils/upstash.js';

const router = express.Router();

const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_VERSION = 'stock-v1';

const COUNTRY_INDEX = {
  US: { symbol: '^GSPC', name: 'S&P 500' },
  GB: { symbol: '^FTSE', name: 'FTSE 100' },
  DE: { symbol: '^GDAXI', name: 'DAX' },
  FR: { symbol: '^FCHI', name: 'CAC 40' },
  JP: { symbol: '^N225', name: 'Nikkei 225' },
  CN: { symbol: '000001.SS', name: 'SSE Composite' },
  HK: { symbol: '^HSI', name: 'Hang Seng' },
  IN: { symbol: '^BSESN', name: 'BSE Sensex' },
  KR: { symbol: '^KS11', name: 'KOSPI' },
  TW: { symbol: '^TWII', name: 'TAIEX' },
  AU: { symbol: '^AXJO', name: 'ASX 200' },
  BR: { symbol: '^BVSP', name: 'Bovespa' },
  CA: { symbol: '^GSPTSE', name: 'TSX Composite' },
  MX: { symbol: '^MXX', name: 'IPC Mexico' },
  AR: { symbol: '^MERV', name: 'MERVAL' },
  RU: { symbol: 'IMOEX.ME', name: 'MOEX' },
  ZA: { symbol: '^J203.JO', name: 'JSE All Share' },
  SA: { symbol: '^TASI.SR', name: 'Tadawul' },
  AE: { symbol: 'DFMGI.AE', name: 'DFM General' },
  IL: { symbol: '^TA125.TA', name: 'TA-125' },
  TR: { symbol: 'XU100.IS', name: 'BIST 100' },
  PL: { symbol: '^WIG20', name: 'WIG 20' },
  NL: { symbol: '^AEX', name: 'AEX' },
  CH: { symbol: '^SSMI', name: 'SMI' },
  ES: { symbol: '^IBEX', name: 'IBEX 35' },
  IT: { symbol: 'FTSEMIB.MI', name: 'FTSE MIB' },
  SE: { symbol: '^OMX', name: 'OMX Stockholm 30' },
  NO: { symbol: '^OSEAX', name: 'Oslo All Share' },
  SG: { symbol: '^STI', name: 'STI' },
  TH: { symbol: '^SET.BK', name: 'SET' },
  MY: { symbol: '^KLSE', name: 'KLCI' },
  ID: { symbol: '^JKSE', name: 'Jakarta Composite' },
  PH: { symbol: 'PSEI.PS', name: 'PSEi' },
  NZ: { symbol: '^NZ50', name: 'NZX 50' },
  EG: { symbol: '^EGX30.CA', name: 'EGX 30' },
  CL: { symbol: '^IPSA', name: 'IPSA' },
  PE: { symbol: '^SPBLPGPT', name: 'S&P Lima' },
  AT: { symbol: '^ATX', name: 'ATX' },
  BE: { symbol: '^BFX', name: 'BEL 20' },
  FI: { symbol: '^OMXH25', name: 'OMX Helsinki 25' },
  DK: { symbol: '^OMXC25', name: 'OMX Copenhagen 25' },
  IE: { symbol: '^ISEQ', name: 'ISEQ Overall' },
  PT: { symbol: '^PSI20', name: 'PSI 20' },
  CZ: { symbol: '^PX', name: 'PX Prague' },
  HU: { symbol: '^BUX', name: 'BUX' },
};

router.get('/', async (req, res) => {
  const code = (req.query.code as string || '').toUpperCase();

  if (!code) {
    return res.status(400).json({ error: 'code parameter required' });
  }

  const index = COUNTRY_INDEX[code];
  if (!index) {
    return res.status(200).json({ error: 'No stock index for country', code, available: false });
  }

  const cacheKey = `${CACHE_VERSION}:${code}`;

  // Try Redis cache first
  const cached = await getCachedJson(cacheKey) as any;
  if (cached && typeof cached === 'object' && cached.indexName) {
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    const encodedSymbol = encodeURIComponent(index.symbol);
    // Use 1mo range to handle markets with different trading weeks (e.g. Sun-Thu Middle East)
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=1mo&interval=1d`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!response.ok) {
      console.error('[StockIndex] Yahoo error:', response.status, index.symbol);
      return res.status(502).json({ error: 'Upstream error', available: false });
    }

    const data = await response.json() as any;
    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.status(200).json({ error: 'No data', available: false });
    }

    const allCloses = result.indicators?.quote?.[0]?.close?.filter(v => v != null);
    if (!allCloses || allCloses.length < 2) {
      return res.status(200).json({ error: 'Insufficient data', available: false });
    }

    // Take last ~5 trading days worth of data
    const closes = allCloses.slice(-6);
    const latest = closes[closes.length - 1];
    const oldest = closes[0];
    const weekChange = ((latest - oldest) / oldest) * 100;
    const meta = result.meta || {};

    const payload = {
      available: true,
      code,
      symbol: index.symbol,
      indexName: index.name,
      price: latest.toFixed(2),
      weekChangePercent: weekChange.toFixed(2),
      currency: meta.currency || 'USD',
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    await setCachedJson(cacheKey, payload, CACHE_TTL_SECONDS);

    return res.status(200).json(payload);
  } catch (err) {
    console.error('[StockIndex] Error:', err);
    return res.status(500).json({ error: 'Internal error', available: false });
  }
});

export { router };
