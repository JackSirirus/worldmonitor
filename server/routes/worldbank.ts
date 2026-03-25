/**
 * World Bank API proxy
 * Fetches economic and tech indicators from World Bank
 */

import express from 'express';

const router = express.Router();

const TECH_INDICATORS: Record<string, string> = {
  'IT.NET.USER.ZS': 'Internet Users (% of population)',
  'IT.CEL.SETS.P2': 'Mobile Subscriptions (per 100 people)',
  'IT.NET.BBND.P2': 'Fixed Broadband Subscriptions (per 100 people)',
  'IT.NET.SECR.P6': 'Secure Internet Servers (per million people)',
  'GB.XPD.RSDV.GD.ZS': 'R&D Expenditure (% of GDP)',
  'IP.PAT.RESD': 'Patent Applications (residents)',
  'IP.PAT.NRES': 'Patent Applications (non-residents)',
  'IP.TMK.TOTL': 'Trademark Applications',
  'TX.VAL.TECH.MF.ZS': 'High-Tech Exports (% of manufactured exports)',
  'BX.GSR.CCIS.ZS': 'ICT Service Exports (% of service exports)',
  'TM.VAL.ICTG.ZS.UN': 'ICT Goods Imports (% of total goods imports)',
  'SE.TER.ENRR': 'Tertiary Education Enrollment (%)',
  'SE.XPD.TOTL.GD.ZS': 'Education Expenditure (% of GDP)',
  'NY.GDP.MKTP.KD.ZG': 'GDP Growth (annual %)',
  'NY.GDP.PCAP.CD': 'GDP per Capita (current US$)',
  'NE.EXP.GNFS.ZS': 'Exports of Goods & Services (% of GDP)',
};

const TECH_COUNTRIES = [
  'USA', 'CHN', 'JPN', 'DEU', 'KOR', 'GBR', 'IND', 'ISR', 'SGP', 'TWN',
  'FRA', 'CAN', 'SWE', 'NLD', 'CHE', 'FIN', 'IRL', 'AUS', 'BRA', 'IDN',
  'ARE', 'SAU', 'QAT', 'BHR', 'EGY', 'TUR',
  'MYS', 'THA', 'VNM', 'PHL',
  'ESP', 'ITA', 'POL', 'CZE', 'DNK', 'NOR', 'AUT', 'BEL', 'PRT', 'EST',
  'MEX', 'ARG', 'CHL', 'COL',
  'ZAF', 'NGA', 'KEN',
];

router.get('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { indicator, country, countries, years = '5', action } = req.query;

  // Return available indicators
  if (action === 'indicators') {
    return res.set('Cache-Control', 'public, max-age=86400').json({
      indicators: TECH_INDICATORS,
      defaultCountries: TECH_COUNTRIES,
    });
  }

  // Validate indicator
  if (!indicator) {
    return res.status(400).json({
      error: 'Missing indicator parameter',
      availableIndicators: Object.keys(TECH_INDICATORS),
    });
  }

  try {
    // Build country list
    let countryList = (country as string) || (countries as string) || TECH_COUNTRIES.join(';');
    if (countries) {
      countryList = (countries as string).split(',').join(';');
    }

    // Calculate date range
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - parseInt(years as string);

    // World Bank API v2
    const wbUrl = `https://api.worldbank.org/v2/country/${countryList}/indicator/${indicator}?format=json&date=${startYear}:${currentYear}&per_page=1000`;

    const response = await fetch(wbUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; WorldMonitor/1.0; +https://worldmonitor.app)',
      },
    });

    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }

    const data = await response.json();

    // World Bank returns [metadata, data] array
    if (!data || !Array.isArray(data) || data.length < 2 || !data[1]) {
      return res.set('Cache-Control', 'public, max-age=3600').json({
        indicator,
        indicatorName: TECH_INDICATORS[indicator as string] || indicator,
        metadata: { page: 1, pages: 1, total: 0 },
        byCountry: {},
        latestByCountry: {},
        timeSeries: [],
      });
    }

    const [metadata, records] = data;

    // Transform data
    const transformed: any = {
      indicator,
      indicatorName: TECH_INDICATORS[indicator as string] || (records[0]?.indicator?.value || indicator),
      metadata: { page: metadata.page, pages: metadata.pages, total: metadata.total },
      byCountry: {},
      latestByCountry: {},
      timeSeries: [],
    };

    for (const record of records || []) {
      const countryCode = record.countryiso3code || record.country?.id;
      const countryName = record.country?.value;
      const year = record.date;
      const value = record.value;

      if (!countryCode || value === null) continue;

      if (!transformed.byCountry[countryCode]) {
        transformed.byCountry[countryCode] = { code: countryCode, name: countryName, values: [] };
      }
      transformed.byCountry[countryCode].values.push({ year, value });

      if (!transformed.latestByCountry[countryCode] || year > transformed.latestByCountry[countryCode].year) {
        transformed.latestByCountry[countryCode] = { code: countryCode, name: countryName, year, value };
      }

      transformed.timeSeries.push({ countryCode, countryName, year, value });
    }

    // Sort
    for (const c of Object.values(transformed.byCountry) as any[]) {
      c.values.sort((a: any, b: any) => a.year - b.year);
    }
    transformed.timeSeries.sort((a: any, b: any) => b.year - a.year || a.countryCode.localeCompare(b.countryCode));

    return res.set('Cache-Control', 'public, max-age=3600').json(transformed);
  } catch (error: any) {
    return res.status(500).json({ error: error.message, indicator });
  }
});

export { router };
