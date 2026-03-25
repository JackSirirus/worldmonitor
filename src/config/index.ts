// Configuration exports
// For variant-specific builds, set VITE_VARIANT environment variable
// VITE_VARIANT=tech → startups.worldmonitor.app (tech-focused)
// VITE_VARIANT=full → worldmonitor.app (geopolitical)

// Export the raw compiled variant first to avoid circular dependency issues
export const COMPILED_VARIANT: 'tech' | 'full' = (import.meta.env.VITE_VARIANT || 'full') as 'tech' | 'full';

/**
 * Get the current site variant at runtime.
 * Priority: URL parameter > localStorage > compiled value
 */
export function getVariant(): 'tech' | 'full' {
  // Check URL parameter first
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlVariant = params.get('variant');
    if (urlVariant === 'tech' || urlVariant === 'full') {
      return urlVariant;
    }
    // Check localStorage
    const stored = localStorage.getItem('worldmonitor-variant');
    if (stored === 'tech' || stored === 'full') {
      return stored;
    }
  }
  return COMPILED_VARIANT;
}

/**
 * Get the compiled (build-time) variant - useful for initial state
 */
export const SITE_VARIANT = COMPILED_VARIANT;

/**
 * Generate the URL for the other variant using URL parameter
 * Uses current hostname + port + ?variant= param (works in both dev and prod)
 */
export function getOtherVariantUrl(): string {
  if (typeof window === 'undefined') return '/?variant=full';

  const port = window.location.port ? `:${window.location.port}` : '';
  const currentVariant = getVariant();
  const targetVariant = currentVariant === 'tech' ? 'full' : 'tech';

  // Get current search params to preserve them (lang, lat, lon, zoom, etc.)
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('variant', targetVariant);

  return `${window.location.protocol}//${window.location.hostname}${port}${window.location.pathname}?${searchParams.toString()}`;
}

// Shared base configuration (always included)
export {
  API_URLS,
  REFRESH_INTERVALS,
  MONITOR_COLORS,
  STORAGE_KEYS,
} from './variants/base';

// Market data (shared)
export { SECTORS, COMMODITIES, MARKET_SYMBOLS, CRYPTO_MAP } from './markets';

// Geo data (shared base)
export { UNDERSEA_CABLES, MAP_URLS } from './geo';

// AI Datacenters (shared)
export { AI_DATA_CENTERS } from './ai-datacenters';

// Feeds configuration (shared functions, variant-specific data)
export {
  SOURCE_TIERS,
  getSourceTier,
  SOURCE_TYPES,
  getSourceType,
  getSourcePropagandaRisk,
  ALERT_KEYWORDS,
  ALERT_EXCLUSIONS,
  type SourceRiskProfile,
  type SourceType,
} from './feeds';

// Panel configuration - imported from panels.ts
export {
  DEFAULT_PANELS,
  DEFAULT_MAP_LAYERS,
  MOBILE_DEFAULT_MAP_LAYERS,
} from './panels';

// ============================================
// VARIANT-SPECIFIC EXPORTS
// Only import what's needed for each variant
// ============================================

// Full variant (geopolitical) - only included in full builds
// These are large data files that should be tree-shaken in tech builds
export {
  FEEDS,
  INTEL_SOURCES,
} from './feeds';

export {
  INTEL_HOTSPOTS,
  CONFLICT_ZONES,
  MILITARY_BASES,
  NUCLEAR_FACILITIES,
  APT_GROUPS,
  STRATEGIC_WATERWAYS,
  ECONOMIC_CENTERS,
  SANCTIONED_COUNTRIES,
  SPACEPORTS,
  CRITICAL_MINERALS,
} from './geo';

export { GAMMA_IRRADIATORS } from './irradiators';
export { PIPELINES, PIPELINE_COLORS } from './pipelines';
export { PORTS } from './ports';
export { MONITORED_AIRPORTS, FAA_AIRPORTS } from './airports';
export {
  ENTITY_REGISTRY,
  getEntityById,
  type EntityType,
  type EntityEntry,
} from './entities';

// Tech variant - these are included in tech builds
export { TECH_COMPANIES } from './tech-companies';
export { AI_RESEARCH_LABS } from './ai-research-labs';
export { STARTUP_ECOSYSTEMS } from './startup-ecosystems';
export {
  AI_REGULATIONS,
  REGULATORY_ACTIONS,
  COUNTRY_REGULATION_PROFILES,
  getUpcomingDeadlines,
  getRecentActions,
} from './ai-regulations';
export {
  STARTUP_HUBS,
  ACCELERATORS,
  TECH_HQS,
  CLOUD_REGIONS,
  type StartupHub,
  type Accelerator,
  type TechHQ,
  type CloudRegion,
} from './tech-geo';
