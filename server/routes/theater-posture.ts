/**
 * Theater Posture API - Aggregates military aircraft by theater
 * Caches results in Upstash Redis for cross-user efficiency
 * TTL: 5 minutes (matches OpenSky refresh rate)
 */

import express from 'express';
import { getRedis } from '../utils/upstash.js';
import { recordCacheTelemetry } from '../utils/telemetry.js';

const router = express.Router();

const CACHE_TTL_SECONDS = 300; // 5 minutes
const STALE_CACHE_TTL_SECONDS = 86400; // 24 hours
const BACKUP_CACHE_TTL_SECONDS = 604800; // 7 days
const CACHE_KEY = 'theater-posture:v4';
const STALE_CACHE_KEY = 'theater-posture:stale:v4';
const BACKUP_CACHE_KEY = 'theater-posture:backup:v4';

// Theater definitions
const POSTURE_THEATERS = [
  { id: 'iran-theater', name: 'Iran Theater', shortName: 'IRAN', targetNation: 'Iran', bounds: { north: 42, south: 20, east: 65, west: 30 }, thresholds: { elevated: 8, critical: 20 } },
  { id: 'taiwan-theater', name: 'Taiwan Strait', shortName: 'TAIWAN', targetNation: 'Taiwan', bounds: { north: 30, south: 18, east: 130, west: 115 }, thresholds: { elevated: 6, critical: 15 } },
  { id: 'baltic-theater', name: 'Baltic Theater', shortName: 'BALTIC', targetNation: null, bounds: { north: 65, south: 52, east: 32, west: 10 }, thresholds: { elevated: 5, critical: 12 } },
  { id: 'blacksea-theater', name: 'Black Sea', shortName: 'BLACK SEA', targetNation: null, bounds: { north: 48, south: 40, east: 42, west: 26 }, thresholds: { elevated: 4, critical: 10 } },
  { id: 'korea-theater', name: 'Korean Peninsula', shortName: 'KOREA', targetNation: 'North Korea', bounds: { north: 43, south: 33, east: 132, west: 124 }, thresholds: { elevated: 5, critical: 12 } },
  { id: 'south-china-sea', name: 'South China Sea', shortName: 'SCS', targetNation: null, bounds: { north: 25, south: 5, east: 121, west: 105 }, thresholds: { elevated: 6, critical: 15 } },
  { id: 'east-med-theater', name: 'Eastern Mediterranean', shortName: 'E.MED', targetNation: null, bounds: { north: 37, south: 33, east: 37, west: 25 }, thresholds: { elevated: 4, critical: 10 } },
  { id: 'israel-gaza-theater', name: 'Israel/Gaza', shortName: 'GAZA', targetNation: 'Gaza', bounds: { north: 33, south: 29, east: 36, west: 33 }, thresholds: { elevated: 3, critical: 8 } },
  { id: 'yemen-redsea-theater', name: 'Yemen/Red Sea', shortName: 'RED SEA', targetNation: 'Yemen', bounds: { north: 22, south: 11, east: 54, west: 32 }, thresholds: { elevated: 4, critical: 10 } },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Military hex database - load from utils
let MILITARY_HEX_SET: Set<string> | null = null;

async function getMilitaryHexSet(): Promise<Set<string>> {
  if (MILITARY_HEX_SET) return MILITARY_HEX_SET;

  try {
    const militaryHex = await import('../utils/military-hex.js') as any;
    const hexList = militaryHex.MILITARY_HEX_LIST || [];
    MILITARY_HEX_SET = new Set(hexList.map((h: string) => h.toLowerCase()));
  } catch {
    MILITARY_HEX_SET = new Set();
  }
  console.log(`[TheaterPosture] Loaded ${MILITARY_HEX_SET.size} military hex IDs`);
  return MILITARY_HEX_SET;
}

function isMilitaryHex(hexId: string): boolean {
  if (!hexId) return false;
  const cleanHex = String(hexId).replace(/^~/, '').toLowerCase();
  return false; // Will be set after loading
}

const MILITARY_PREFIXES = [
  'RCH', 'REACH', 'MOOSE', 'EVAC', 'DUSTOFF', 'PEDRO', 'DUKE', 'HAVOC', 'KNIFE', 'WARHAWK', 'VIPER', 'RAGE', 'FURY',
  'SHELL', 'TEXACO', 'ARCO', 'ESSO', 'PETRO', 'SENTRY', 'AWACS', 'MAGIC', 'DISCO', 'DARKSTAR',
  'COBRA', 'PYTHON', 'RAPTOR', 'EAGLE', 'HAWK', 'TALON', 'BOXER', 'OMNI', 'TOPCAT', 'SKULL', 'REAPER', 'HUNTER',
  'ARMY', 'NAVY', 'USAF', 'USMC', 'USCG', 'AE', 'CNV', 'PAT', 'SAM', 'EXEC', 'OPS', 'CTF', 'TF',
  'NATO', 'GAF', 'RRF', 'RAF', 'FAF', 'IAF', 'RNLAF', 'BAF', 'DAF', 'HAF', 'PAF',
  'SWORD', 'LANCE', 'ARROW', 'SPARTAN', 'RSAF', 'EMIRI', 'UAEAF', 'KAF', 'QAF', 'BAHAF', 'OMAAF',
  'IRIAF', 'IRG', 'IRGC', 'TAF', 'TUAF', 'RSD', 'RF', 'RFF', 'VKS', 'CHN', 'PLAAF', 'PLA',
];

const AIRLINE_CODES = new Set([
  'SVA', 'QTR', 'THY', 'UAE', 'ETD', 'GFA', 'MEA', 'RJA', 'KAC', 'ELY', 'IAW', 'IRA', 'MSR', 'SYR', 'PGT',
  'BAW', 'AFR', 'DLH', 'KLM', 'AUA', 'SAS', 'FIN', 'LOT', 'AZA', 'TAP', 'IBE', 'VLG', 'RYR', 'EZY', 'WZZ',
  'AIC', 'CPA', 'SIA', 'MAS', 'THA', 'VNM', 'JAL', 'ANA', 'KAL', 'AAR', 'EVA', 'CCA', 'CES', 'CSN',
  'AAL', 'DAL', 'UAL', 'SWA', 'JBU', 'FFT', 'ASA', 'NKS', 'WJA', 'ACA', 'FDX', 'UPS', 'GTI',
]);

function detectAircraftType(callsign: string): string {
  if (!callsign) return 'unknown';
  const cs = callsign.toUpperCase().trim();
  if (/^(SHELL|TEXACO|ARCO|ESSO|PETRO)/.test(cs) || /^(KC|STRAT)/.test(cs)) return 'tanker';
  if (/^(SENTRY|AWACS|MAGIC|DISCO|DARKSTAR)/.test(cs) || /^(E3|E8|E6)/.test(cs)) return 'awacs';
  if (/^(RCH|REACH|MOOSE|EVAC|DUSTOFF)/.test(cs) || /^(C17|C5|C130|C40)/.test(cs)) return 'transport';
  if (/^(HOMER|OLIVE|JAKE|PSEUDO|GORDO)/.test(cs) || /^(RC|U2|SR)/.test(cs)) return 'reconnaissance';
  if (/^(RQ|MQ|REAPER|PREDATOR|GLOBAL)/.test(cs)) return 'drone';
  if (/^(DEATH|BONE|DOOM)/.test(cs) || /^(B52|B1|B2)/.test(cs)) return 'bomber';
  return 'unknown';
}

function isMilitaryCallsign(callsign: string): boolean {
  if (!callsign) return false;
  const cs = callsign.toUpperCase().trim();
  for (const prefix of MILITARY_PREFIXES) {
    if (cs.startsWith(prefix)) return true;
  }
  if (/^[A-Z]{4,}\d{1,3}$/.test(cs)) return true;
  if (/^[A-Z]{3}\d{1,2}$/.test(cs)) {
    const prefix = cs.slice(0, 3);
    if (!AIRLINE_CODES.has(prefix)) return true;
  }
  return false;
}

async function fetchMilitaryFlights(): Promise<any[]> {
  const relayUrl = process.env.WS_RELAY_URL || 'https://worldmonitor-production-ws.up.railway.app';
  const baseUrl = relayUrl + '/opensky';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    console.log('[TheaterPosture] Fetching from:', baseUrl);
    const response = await fetch(baseUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 WorldMonitor/1.0' },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`OpenSky API error: ${response.status}`);

    const data = await response.json() as any;
    if (!data.states) return [];

    const hexSet = await getMilitaryHexSet();
    const flights = [];

    for (const state of data.states as any[]) {
      const [icao24, callsign, , , , lon, lat, altitude, onGround, velocity, heading] = state;
      if (lat == null || lon == null || onGround) continue;

      const isMilitary = isMilitaryCallsign(callsign) || (hexSet.has(String(icao24).toLowerCase()));
      if (!isMilitary) continue;

      flights.push({
        id: icao24,
        callsign: callsign?.trim() || '',
        lat, lon, altitude: altitude || 0, heading: heading || 0, speed: velocity || 0,
        aircraftType: detectAircraftType(callsign),
        operator: 'unknown',
      });
    }
    return flights;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('OpenSky API timeout');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function calculatePostures(flights: any[]) {
  const summaries = [];

  for (const theater of POSTURE_THEATERS) {
    const theaterFlights = flights.filter(f =>
      f.lat >= theater.bounds.south && f.lat <= theater.bounds.north &&
      f.lon >= theater.bounds.west && f.lon <= theater.bounds.east
    );

    const byType = {
      fighters: theaterFlights.filter(f => f.aircraftType === 'fighter').length,
      tankers: theaterFlights.filter(f => f.aircraftType === 'tanker').length,
      awacs: theaterFlights.filter(f => f.aircraftType === 'awacs').length,
      reconnaissance: theaterFlights.filter(f => f.aircraftType === 'reconnaissance').length,
      transport: theaterFlights.filter(f => f.aircraftType === 'transport').length,
      bombers: theaterFlights.filter(f => f.aircraftType === 'bomber').length,
      drones: theaterFlights.filter(f => f.aircraftType === 'drone').length,
      unknown: theaterFlights.filter(f => f.aircraftType === 'unknown').length,
    };

    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    const postureLevel = total >= theater.thresholds.critical ? 'critical' :
                        total >= theater.thresholds.elevated ? 'elevated' : 'normal';

    const parts = [];
    if (byType.fighters > 0) parts.push(`${byType.fighters} fighters`);
    if (byType.tankers > 0) parts.push(`${byType.tankers} tankers`);
    if (byType.awacs > 0) parts.push(`${byType.awacs} AWACS`);
    if (byType.reconnaissance > 0) parts.push(`${byType.reconnaissance} recon`);
    if (byType.bombers > 0) parts.push(`${byType.bombers} bombers`);
    if (byType.transport > 0) parts.push(`${byType.transport} transport`);
    if (byType.drones > 0) parts.push(`${byType.drones} drones`);
    const summary = parts.join(', ') || 'No military aircraft';

    summaries.push({
      theaterId: theater.id,
      theaterName: theater.name,
      shortName: theater.shortName,
      targetNation: theater.targetNation,
      ...byType,
      totalAircraft: total,
      destroyers: 0, frigates: 0, carriers: 0, submarines: 0, patrol: 0, auxiliaryVessels: 0, totalVessels: 0,
      postureLevel,
      strikeCapable: false,
      trend: 'stable',
      changePercent: 0,
      summary,
      headline: postureLevel === 'critical' ? `Critical military buildup - ${theater.name}` :
                 postureLevel === 'elevated' ? `Elevated military activity - ${theater.name}` :
                 `Normal activity - ${theater.name}`,
      centerLat: (theater.bounds.north + theater.bounds.south) / 2,
      centerLon: (theater.bounds.east + theater.bounds.west) / 2,
      bounds: theater.bounds,
    });
  }

  return summaries;
}

router.get('/', async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(204).set(corsHeaders).send();
  }

  try {
    const redisClient = getRedis();

    // Try cache first
    if (redisClient) {
      try {
        const cached = await redisClient.get(CACHE_KEY) as any;
        if (cached) {
          console.log('[TheaterPosture] Cache hit');
          recordCacheTelemetry('/api/theater-posture', 'REDIS-HIT');
          return res.status(200).set({ ...corsHeaders, 'Cache-Control': 'public, max-age=60' }).json({ ...cached, cached: true });
        }
      } catch (err: any) {
        console.warn('[TheaterPosture] Cache read error:', err.message);
      }
    }

    // Fetch fresh data
    console.log('[TheaterPosture] Fetching fresh data...');
    const flights = await fetchMilitaryFlights();
    const postures = calculatePostures(flights);

    const result = {
      postures,
      totalFlights: flights.length,
      timestamp: new Date().toISOString(),
      cached: false,
      source: 'opensky',
    };

    // Cache result
    if (redisClient) {
      try {
        await Promise.all([
          redisClient.set(CACHE_KEY, result, { ex: CACHE_TTL_SECONDS }),
          redisClient.set(STALE_CACHE_KEY, result, { ex: STALE_CACHE_TTL_SECONDS }),
          redisClient.set(BACKUP_CACHE_KEY, result, { ex: BACKUP_CACHE_TTL_SECONDS }),
        ]);
        console.log('[TheaterPosture] Cached result');
      } catch (err: any) {
        console.warn('[TheaterPosture] Cache write error:', err.message);
      }
    }

    recordCacheTelemetry('/api/theater-posture', 'MISS');
    return res.status(200).set({ ...corsHeaders, 'Cache-Control': 'public, max-age=60' }).json(result);

  } catch (error: any) {
    console.error('[TheaterPosture] Error:', error);

    // Try stale cache
    const redisClient = getRedis();
    if (redisClient) {
      try {
        const stale = await redisClient.get(STALE_CACHE_KEY) as any;
        if (stale) {
          recordCacheTelemetry('/api/theater-posture', 'STALE');
          return res.status(200).set({ ...corsHeaders, 'Cache-Control': 'public, max-age=30' }).json({ ...stale, cached: true, stale: true });
        }
      } catch {}
    }

    return res.status(500).set(corsHeaders).json({ error: error.message, postures: [], timestamp: new Date().toISOString() });
  }
});

export { router };
