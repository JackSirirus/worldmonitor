/**
 * i18n Helper for UI Components
 * Simplifies component migration by providing helper functions
 */
import { t } from '@/i18n';

/**
 * Common UI strings
 */
export const ui = {
  loading: () => t('common.loading'),
  failed: () => t('common.failed'),
  noData: () => t('common.noData'),
  live: () => t('common.live'),
  close: () => t('modal.close'),
  cancel: () => t('modal.cancel'),
  save: () => t('modal.save'),
  searchPlaceholder: () => t('search.placeholder'),
  noResults: () => t('search.noResults'),
  changeLanguage: () => t('common.changeLanguage'),
};

/**
 * Panel-specific strings
 */
export const panel = {
  resizeTooltip: () => t('panel.resizeTooltip'),
  summarize: () => t('panel.summarize'),
  generating: () => t('panel.generating'),
  newBadge: () => t('panel.newBadge'),
  alert: () => t('panel.alert'),
  showMethodology: () => t('panel.showMethodology'),
};

/**
 * News-specific strings
 */
export const news = {
  noData: () => t('news.noData'),
  sources: () => t('news.sources'),
  also: () => t('news.also'),
  alsoReportedBy: () => t('news.alsoReportedBy'),
  related: () => t('news.related'),
  relatedAssetsNear: () => t('news.relatedAssetsNear'),
  failedToCluster: () => t('news.failedToCluster'),
  stateMedia: () => t('news.stateMedia'),
  caution: () => t('news.caution'),
  wire: () => t('news.wire'),
  stateAffiliated: () => t('news.stateAffiliated'),
  verifiedOutlet: () => t('news.verifiedOutlet'),
  wireServiceReliability: () => t('news.wireServiceReliability'),
  officialGovernment: () => t('news.officialGovernment'),
  sourceCount: (n: number) => t('news.sourceCount', { n }),
  sourcesPerHour: (n: number) => t('news.sourcesPerHour', { n }),
};

/**
 * Status-specific strings
 */
export const status = {
  systemStatus: () => t('status.systemStatus'),
  systemHealth: () => t('status.systemHealth'),
  dataFeeds: () => t('status.dataFeeds'),
  apiStatus: () => t('status.apiStatus'),
  storage: () => t('status.storage'),
  updatedJustNow: () => t('status.updatedJustNow'),
};

/**
 * Playback-specific strings
 */
export const playback = {
  toggleMode: () => t('playback.toggleMode'),
  historicalPlayback: () => t('playback.historicalPlayback'),
  live: () => t('common.live'),
};

/**
 * Time formatting helpers
 */
export const time = {
  justNow: () => t('time.justNow'),
  minutesAgo: (n: number) => t('time.minutesAgo', { n }),
  hoursAgo: (n: number) => t('time.hoursAgo', { n }),
  daysAgo: (n: number) => t('time.daysAgo', { n }),
};

/**
 * Panel ID to translation key mapping
 * Maps config panel IDs to their corresponding translation keys
 */
const PANEL_ID_TO_I18N_KEY: Record<string, string> = {
  // Full variant
  map: 'globalMap',
  'live-news': 'liveNews',
  insights: 'aiInsights',
  'strategic-posture': 'aiStrategicPosture',
  cii: 'countryInstability',
  'strategic-risk': 'strategicRiskOverview',
  intel: 'intelFeed',
  'gdelt-intel': 'liveIntelligence',
  cascade: 'infrastructureCascade',
  politics: 'worldNews',
  middleeast: 'middleEast',
  africa: 'africa',
  latam: 'latinAmerica',
  asia: 'asiaPacific',
  energy: 'energyResources',
  gov: 'government',
  thinktanks: 'thinkTanks',
  polymarket: 'predictions',
  commodities: 'commodities',
  markets: 'markets',
  economic: 'economicIndicators',
  finance: 'financial',
  tech: 'technology',
  crypto: 'crypto',
  heatmap: 'sectorHeatmap',
  ai: 'aiMl',
  layoffs: 'layoffsTracker',
  monitors: 'myMonitors',
  'satellite-fires': 'fires',
  'macro-signals': 'marketRadar',
  'etf-flows': 'btcEtfTracker',
  stablecoins: 'stablecoins',
  // Tech variant (differences from full)
  startups: 'startupsVc',
  vcblogs: 'vcInsightsEssays',
  regionalStartups: 'globalStartupNews',
  unicorns: 'unicornTracker',
  accelerators: 'acceleratorsDemoDays',
  security: 'cybersecurity',
  policy: 'aiPolicyRegulation',
  regulation: 'aiRegulationDashboard',
  hardware: 'semiconductorsHardware',
  cloud: 'cloudInfrastructure',
  dev: 'developerCommunity',
  github: 'githubTrending',
  ipo: 'ipoSpac',
  polymarket_tech: 'techPredictions',  // Same key different context
  funding: 'fundingVc',
  producthunt: 'productHunt',
  events: 'techEvents',
  'service-status': 'serviceStatus',
  'tech-readiness': 'techReadinessIndex',
};

/**
 * Panel name helper
 * @param panelKey - The panel ID from config
 * @returns Translated panel name
 */
export function getPanelName(panelKey: string): string {
  // Map panel ID to translation key
  const i18nKey = PANEL_ID_TO_I18N_KEY[panelKey] || panelKey;
  return t(`panels.${i18nKey}`);
}
