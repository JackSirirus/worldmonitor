/**
 * Source Tiers Service
 * Fetches source tiers from backend API with local cache
 */

interface SourceTier {
  url: string;
  name: string;
  category: string;
  tier: number;
}

interface SourceTiersCache {
  data: SourceTier[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: SourceTiersCache | null = null;

/**
 * Fetch source tiers from backend API
 */
export async function fetchSourceTiers(forceRefresh = false): Promise<Record<string, number>> {
  // Check cache
  if (!forceRefresh && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data.reduce((acc, s) => {
      acc[s.name] = s.tier;
      return acc;
    }, {} as Record<string, number>);
  }

  try {
    const response = await fetch('/api/source-tiers');
    const data = await response.json();

    if (data.success && data.sources) {
      cache = {
        data: data.sources,
        timestamp: Date.now(),
      };

      return data.sources.reduce((acc: Record<string, number>, s: SourceTier) => {
        acc[s.name] = s.tier;
        return acc;
      }, {});
    }
  } catch (error) {
    console.error('[SourceTiersService] Failed to fetch:', error);
  }

  // Return empty on failure (will fallback to config)
  return {};
}

/**
 * Get source tier with fallback to config
 */
export async function getSourceTier(sourceName: string): Promise<number> {
  const tiers = await fetchSourceTiers();
  if (tiers[sourceName] !== undefined) {
    return tiers[sourceName];
  }

  // Fallback to config
  const { SOURCE_TIERS } = await import('@/config/feeds');
  return SOURCE_TIERS[sourceName] ?? 4;
}

export default {
  fetchSourceTiers,
  getSourceTier,
};
