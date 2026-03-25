/**
 * Military Hex Database
 * Types for the hex grid system used in theater posture visualization
 */

export interface HexData {
  q: number;
  r: number;
  s: number;
  country: string;
  baseName?: string;
  baseType?: string;
  lat?: number;
  lon?: number;
}

// Empty array as placeholder - actual data would be loaded from a file or database
export const MILITARY_HEX_LIST: string[] = [];

export const MILITARY_HEX_DB: Record<string, HexData> = {};

export function getHexByCountry(countryCode: string): HexData[] {
  return Object.values(MILITARY_HEX_DB).filter(h => h.country === countryCode);
}

export function getHexById(hexId: string): HexData | undefined {
  return MILITARY_HEX_DB[hexId];
}
