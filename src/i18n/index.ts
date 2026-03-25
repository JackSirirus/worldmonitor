/**
 * i18n Engine for WorldMonitor
 * Supports English (en), Simplified Chinese (zh-cn), and Traditional Chinese (zh-tw)
 */

const LOCALE_KEY = 'worldmonitor-locale';
const SUPPORTED_LOCALES = ['en', 'zh-cn', 'zh-tw'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

let currentLocale: Locale = 'en';
let translations: Record<Locale, TranslationData>;

/**
 * Translation data type (derived from locale files)
 */
export interface TranslationData {
  common: {
    loading: string;
    failed: string;
    noData: string;
    live: string;
    changeLanguage: string;
  };
  panels: Record<string, string>;
  panel: {
    resizeTooltip: string;
    summarize: string;
    generating: string;
    newBadge: string;
    alert: string;
    showMethodology: string;
  };
  news: {
    noData: string;
    sources: string;
    also: string;
    alsoReportedBy: string;
    related: string;
    relatedAssetsNear: string;
    failedToCluster: string;
    sourceCount: (n: number) => string;
    sourcesPerHour: (n: number) => string;
    stateMedia: string;
    caution: string;
    wire: string;
    stateAffiliated: string;
    verifiedOutlet: string;
    wireServiceReliability: string;
    officialGovernment: string;
  };
  status: {
    systemStatus: string;
    systemHealth: string;
    dataFeeds: string;
    apiStatus: string;
    storage: string;
    updatedJustNow: string;
    storageUnavailable: string;
  };
  playback: {
    toggleMode: string;
    historicalPlayback: string;
  };
  search: {
    placeholder: string;
    noResults: string;
  };
  modal: {
    close: string;
    cancel: string;
    save: string;
  };
  time: {
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
  };
  countryIntel: {
    loadingIndex: string;
    loadingMarkets: string;
  };
  cii: {
    scanning: string;
    failedToCalculate: string;
  };
  cascade: {
    failedToBuild: string;
  };
  market: {
    failedToLoad: string;
    failedSector: string;
    failedCommodities: string;
    failedCrypto: string;
  };
  prediction: {
    failedToLoad: string;
  };
  monitor: {
    addKeywords: string;
    noMatches: string;
    noMatchesCount: (n: number) => string;
    showingMatches: (n: number) => string;
  };
  liveNews: {
    checkingServices: string;
    retry: string;
    isNotLive: string;
    togglePlayback: string;
    toggleSound: string;
  };
  serviceStatus: {
    checkingServices: string;
    retry: string;
    allOperational: string;
  };
  techEvents: {
    loading: string;
    retry: string;
    noEvents: string;
    conferences: string;
    onMap: string;
  };
  techHubs: {
    noActive: string;
  };
  techReadiness: {
    failedToLoad: string;
    noData: string;
    fetchingData: string;
    analyzing: string;
  };
  signalModal: {
    intelligenceFinding: string;
    dismiss: string;
    soundAlerts: string;
    confidence: string;
    whyItMatters: string;
    action: string;
    note: string;
    country: string;
    scoreChange: string;
    instabilityLevel: string;
    primaryDriver: string;
    location: string;
    eventTypes: string;
    eventCount: string;
    source: string;
    countriesAffected: string;
    impactLevel: string;
    viewOnMap: string;
  };
  storyModal: {
    generatingStory: string;
    savePng: string;
    whatsapp: string;
    x: string;
    linkedIn: string;
    link: string;
    copied: string;
    saved: string;
    opening: string;
    failedToGenerate: string;
  };
  mobileWarning: {
    mobileView: string;
    dontShowAgain: string;
    gotIt: string;
    simplifiedMobileVersion: string;
    tipUseViewButtons: string;
  };
  strategicRisk: {
    insufficientData: string;
    enableCoreFeeds: string;
    refresh: string;
    requiredDataSources: string;
    optionalSources: string;
    waitingForData: string;
    learningMode: string;
    untilReliable: string;
    noSignificantRisks: string;
    convergence: string;
    ciiDeviation: string;
    infraEvents: string;
    highAlerts: string;
    topRisks: string;
    recentAlerts: string;
    trend: string;
    enable: string;
    noData: string;
    rising: string;
    falling: string;
    stable: string;
    critical: string;
    elevated: string;
    moderate: string;
    low: string;
  };
  strategicPosture: {
    scanningTheaters: string;
    aircraftPositions: string;
    navalVessels: string;
    theaterAnalysis: string;
    connectingToLiveStreams: string;
    elapsed: string;
    initialLoadTakesTime: string;
    acquiringData: string;
    connectingToAdsb: string;
    mayTakeTime: string;
    retryNow: string;
    feedRateLimited: string;
    tryAgain: string;
    peakHoursTip: string;
    usingCachedData: string;
    liveFeedUnavailable: string;
    strike: string;
  };
  gdeltIntel: {
    failedToLoad: string;
    noRecentArticles: string;
  };
  macroSignals: {
    computingSignals: string;
    noData: string;
    overall: string;
    bullish: string;
    liquidity: string;
    flow: string;
    regime: string;
    btcTrend: string;
    hashRate: string;
    mining: string;
    fearGreed: string;
  };
  etfFlows: {
    loadingData: string;
    noData: string;
    netFlow: string;
    estFlow: string;
    totalVol: string;
    etfs: string;
    ticker: string;
    issuer: string;
    volume: string;
    change: string;
  };
  stablecoin: {
    loadingStablecoins: string;
    noData: string;
    pegHealth: string;
    supplyVolume: string;
    token: string;
    mcap: string;
    vol: string;
    chg: string;
    healthStatus: string;
  };
  satelliteFires: {
    scanningThermal: string;
    noFireData: string;
    region: string;
    fires: string;
    high: string;
    frp: string;
    total: string;
  };
  economic: {
    noData: string;
    oilDataNotAvailable: string;
    noOilMetrics: string;
    addEiaApiKey: string;
    noGovernmentAwards: string;
    indicators: string;
    oil: string;
    gov: string;
    vsPreviousWeek: string;
  };
  insights: {
    ranking: string;
    analyzingSentiment: string;
    generatingBrief: string;
    generatingBriefMsg: string;
    usingCachedBrief: string;
    multiPerspective: string;
    toneMixed: string;
    toneNegative: string;
    tonePositive: string;
  };
}

/**
 * Safe localStorage wrapper
 */
function getStoredLocale(): Locale | null {
  try {
    return localStorage.getItem(LOCALE_KEY) as Locale;
  } catch (error) {
    console.warn('[i18n] localStorage unavailable:', error);
    return null;
  }
}

/**
 * Safe localStorage setter
 */
function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch (error) {
    console.warn('[i18n] Failed to save locale:', error);
    // Don't throw - app still works
  }
}

/**
 * Initialize i18n system
 */
export async function init(): Promise<void> {
  try {
    // Load all translation modules
    // Note: These are statically bundled, await is just for type resolution
    translations = {
      en: (await import('./locales/en.ts')).default,
      'zh-cn': (await import('./locales/zh-cn.ts')).default,
      'zh-tw': (await import('./locales/zh-tw.ts')).default,
    };

    // Get locale with fallback chain
    const saved = getStoredLocale();
    const detected = detectBrowserLocale();

    // Priority: saved > detected > default (en)
    const initial = saved || detected || 'en';
    setLanguage(initial);

  } catch (error) {
    console.error('[i18n] Initialization failed:', error);
    // Fallback to English mode
    currentLocale = 'en';
  }
}

/**
 * Set current language
 */
export function setLanguage(locale: Locale): void {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`[i18n] Unsupported locale: ${locale}`);
    return;
  }

  currentLocale = locale;
  setStoredLocale(locale);
  updateHtmlLang();
  updateHreflangTags();
  document.dispatchEvent(new CustomEvent('languagechanged'));
}

/**
 * Get current locale
 */
export function getCurrentLocale(): Locale {
  return currentLocale;
}

/**
 * Translation function with parameter support
 * Example: t('news.sourceCount', { n: 5 }) → "5 sources"
 */
export function t(key: string, params?: Record<string, any>): string {
  try {
    // Get translation value (supports nested path)
    let value = getNested(translations[currentLocale], key);

    // Fallback to English
    const fallback = value ?? getNested(translations.en, key);

    // Final fallback (never show undefined)
    if (fallback === undefined || fallback === null) {
      console.warn(`[i18n] Missing translation for "${key}" in "${currentLocale}"`);
      return key; // Return key itself for debugging
    }

    // Parameter interpolation: "Hello {name}" → "Hello World"
    if (params && typeof fallback === 'string') {
      return fallback.replace(/\{(\w+)\}/g, (match, param) => {
        if (params[param] !== undefined) {
          return String(params[param]);
        }
        // Missing parameter - log warning
        console.warn(`[i18n] Missing param "${param}" in translation "${key}"`);
        return match; // Leave {key} in output
      });
    }

    return fallback;

  } catch (error) {
    console.error(`[i18n] Error getting translation for "${key}":`, error);
    return key; // Never crash
  }
}

/**
 * Nested path getter for dot-notation keys
 */
function getNested(obj: any, path: string): any {
  return path.split('.').reduce((current, key) =>
    current?.[key], obj
  );
}

/**
 * Browser language detection
 */
function detectBrowserLocale(): Locale {
  const browserLang = navigator.language || 'en';

  // Map zh -> zh-CN (Simplified Chinese default for zh)
  if (browserLang === 'zh') return 'zh-cn';

  // Map zh-Hant -> zh-TW (Traditional Chinese)
  if (browserLang === 'zh-Hant') return 'zh-tw';

  // Check if directly supported
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // Extract base locale (e.g., zh-CN -> zh)
  const base = browserLang.split('-')[0];
  if (base === 'zh') return 'zh-cn'; // Default to Simplified

  return 'en'; // Fallback to English
}

/**
 * Update HTML lang attribute
 */
function updateHtmlLang(): void {
  document.documentElement.setAttribute('lang', currentLocale);
}

/**
 * Update hreflang tags for SEO
 */
function updateHreflangTags(): void {
  // Remove existing hreflang links
  document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

  const baseUrl = 'https://worldmonitor.app/';
  const locales: Array<{ code: string; label: string }> = [
    { code: 'en', label: 'en' },
    { code: 'zh-CN', label: 'zh-CN' },
    { code: 'zh-TW', label: 'zh-TW' },
  ];

  locales.forEach(({ code: _code, label }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = label;
    link.href = baseUrl;
    document.head.appendChild(link);
  });

  // Add x-default
  const xDefault = document.createElement('link');
  xDefault.rel = 'alternate';
  xDefault.hreflang = 'x-default';
  xDefault.href = baseUrl;
  document.head.appendChild(xDefault);
}

/**
 * Format date based on current locale
 */
export function formatDateLocale(date: Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(currentLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }).format(date);
  } catch (error) {
    console.warn('[i18n] Date formatting error:', error);
    return date.toLocaleString();
  }
}

/**
 * Format number based on current locale
 */
export function formatNumberLocale(num: number, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(currentLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(num);
  } catch (error) {
    console.warn('[i18n] Number formatting error:', error);
    return num.toString();
  }
}

/**
 * Format relative time based on current locale
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo', { n: minutes });
  if (hours < 24) return t('time.hoursAgo', { n: hours });
  return t('time.daysAgo', { n: days });
}
