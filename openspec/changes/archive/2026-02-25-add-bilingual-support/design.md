## Context

WorldMonitor is a vanilla TypeScript + Vite application with no existing i18n infrastructure. The application application displays hardcoded English strings across ~35 components and configuration files. Current architecture uses direct DOM manipulation and component-based rendering.

**Current State:**
- No i18n library or infrastructure
- ~500+ user-facing English strings scattered across codebase
- No language switcher UI
- Single deployment (worldmonitor.app)

**Constraints:**
- Must maintain zero dependency philosophy (no heavy i18n libraries)
- Vanilla TypeScript - no React/Vue
- Two site variants (full/tech) with different panel configurations
- Vercel deployment (edge functions + static assets)

## Goals / Non-Goals

**Goals:**
- Lightweight custom i18n engine (<5KB overhead)
- Support English, Simplified Chinese, Traditional Chinese
- Instant language switching (no reload, no async loading)
- Automatic browser language detection
- localStorage persistence for user preference
- English as fallback for missing translations
- Type-safe translation keys (TypeScript)
- SEO-friendly (hreflang tags, sitemap)
- Date/number formatting based on locale

**Non-Goals:**
- Translation of news/feed content (preserve original language)
- RTL support (architectural preparation only, not enabled)
- Per-language code splitting (all translations in main bundle)
- Auto-translation via API (manual translation files)
- Support for other languages initially

## Decisions

### D1: Custom i18n Engine vs Third-Party Library

**Decision: Custom lightweight i18n engine**

**Rationale:**
- WorldMonitor text volume is small (~500 keys × 3 languages ≈ 15KB gzipped)
- Zero dependency philosophy aligns with project values
- Full control over behavior and debugging
- No API learning curve for contributors
- Bundle size: ~2KB vs i18next ~30KB

**Alternatives Considered:**
- i18next: Full-featured but heavy, unnecessary complexity
- vue-i18n/react-i18next: Framework-specific, not applicable
- formatjs: Good for ICU messages but limited features compared to custom solution

### D2: Single Bundle vs Code Splitting

**Decision: Single bundle (all languages shipped together)**

**Rationale:**
- Language switching must be instant (dashboard users switch frequently)
- 15KB overhead is negligible for dashboard application
- Simpler build and deployment
- No network requests for language switching
- Edge caching on Vercel is efficient

**Trade-off:**
- Initial load slightly heavier for users who only need one language
- Mitigation: Total bundle still <200KB for entire app

**Important Note on Load Strategy:**
```typescript
// Although we use `await import()` syntax for type resolution,
// all translation modules are statically analyzed and bundled
// by Vite at build time. The `await` does NOT mean async
// runtime loading - it's just how TypeScript handles module imports.

// At runtime:
// 1. All translation files are in the main bundle
// 2. `import()` returns immediately (no network request)
// 3. Language switching is instant with simple object lookup
```

### D3: Language Persistence Strategy

**Decision: localStorage with 'worldmonitor-locale' key**

**Rationale:**
- Simple, no backend required
- Persists across sessions
- Easy to reset for testing
- Complements existing localStorage usage pattern in codebase

**Edge Case: localStorage Unavailable**
- **Scenario**: Browser privacy mode, localStorage quota exceeded, or browser restrictions
- **Handling**:
  ```typescript
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    // Use saved value if available
  } catch (error) {
    // localStorage unavailable or quota exceeded
    console.warn('[i18n] localStorage unavailable:', error);
    // Fall back to browser language detection
    // Don't show user-facing error - app still works
  }
  ```

### D4: Translation Key Structure

**Decision: Nested object with dot-notation access**

```typescript
// Structure
{
  common: { loading: '...', failed: '...', live: '...' },  // Added 'live' key
  panels: { liveNews: '...', markets: '...', aiInsights: '...', globalMap: '...' },
  panel: { resizeTooltip: '...', summarize: '...', generating: '...', newBadge: '...', alert: '...' },
  news: { noData: '...', sources: '...', alsoReportedBy: '...', relatedAssetsNear: '...' },
  status: { systemHealth: '...', systemStatus: '...', dataFeeds: '...', apiStatus: '...', storage: '...' },
  playback: { toggleMode: '...', historicalPlayback: '...' },
  search: { placeholder: '...', noResults: '...' },
  time: { justNow: '...', minutesAgo: '...', hoursAgo: '...', daysAgo: '...' },
  modal: { close: '...', cancel: '...', save: '...' },
}

// Access via t('common.loading')
```

**Rationale:**
- Logical grouping mirrors code structure
- Type-safe with TypeScript
- Easy to navigate and maintain
- Supports namespaces for clear ownership

**Alternatives Considered:**
- Flat keys: `common_loading` - harder to navigate
- File-per-namespace: Too many files for small project

### D5: Date/Number Formatting

**Decision: Native Intl API with locale parameter**

```typescript
date.toLocaleString(currentLocale, { month: 'short', day: 'numeric' })
value.toLocaleString(currentLocale, { maximumFractionDigits: 2 })
```

**Rationale:**
- Built into browsers, no library needed
- Automatically handles locale-specific formatting
- Chinese dates: "2024年2月13日"
- English dates: "Feb 13, 2024"

### D6: Relative Time Formatting (formatRelativeTime)

**Decision: Custom implementation with locale-specific templates**

```typescript
export function formatRelativeTime(date: Date, locale: Locale): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const templates = {
    'en': {
      justNow: 'just now',
      minutesAgo: (n: number) => `${n}m ago`,
      hoursAgo: (n: number) => `${n}h ago`,
      daysAgo: (n: number) => `${n}d ago`,
    },
    'zh-cn': {
      justNow: '刚刚',
      minutesAgo: (n: number) => `${n}分钟前`,
      hoursAgo: (n: number) => `${n}小时前`,
      daysAgo: (n: number) => `${n}天前`,
    },
    'zh-tw': {
      justNow: '剛剛',
      minutesAgo: (n: number) => `${n}分鐘前`,
      hoursAgo: (n: number) => `${n}小時前`,
      daysAgo: (n: number) => `${n}天前`,
    },
  };

  const dict = templates[locale] || templates['en'];

  if (seconds < 60) return dict.justNow;
  if (minutes < 60) return dict.minutesAgo(minutes);
  if (hours < 24) return dict.hoursAgo(hours);
  return dict.daysAgo(days);
}
```

### D7: Missing Translation Behavior

**Decision: Fallback to English with console warning**

**Rationale:**
- Never break UI - always show something
- English serves as universal fallback
- Console warnings help catch missing keys during development
- Production users see English (acceptable temporary state)

### D8: Parameter Interpolation

**Decision: Replace {key} placeholders with provided values**

```typescript
// Template: "Hello, {name}!" with params: { name: 'World' }
// Result: "Hello, World!"

// Missing parameter handling:
// If template has {key} but params doesn't have key:
// - Leave {key} unchanged in output
// - Log warning in development mode
```

### D9: SEO Approach

**Decision: hreflang tags + dynamic sitemap (same URL strategy)**

**Rationale:**
- Subdomain approach (zh.worldmonitor.app) requires additional domain setup and DNS
- URL paths (/zh-cn/) need Vercel rewrite rules and increase complexity
- hreflang tags are sufficient for language alternation indication
- Simpler deployment - single route, same HTML/JS
- All language versions exist at same URL (content negotiation)

**Same URL SEO Implications:**
- Google and other search engines can detect language from `<html lang="">` attribute
- hreflang tags indicate that alternative language versions exist
- Search engines will index the same URL multiple times (once per language)
- Users searching in Chinese will be shown Chinese version when available
- This is a valid and simpler approach for content that dynamically changes language

**Implementation:**
```html
<!-- Dynamic injection based on current locale -->
<link rel="alternate" hreflang="en" href="https://worldmonitor.app/" />
<link rel="alternate" hreflang="zh-CN" href="https://worldmonitor.app/" />
<link rel="alternate" hreflang="zh-TW" href="https://worldmonitor.app/" />
<link rel="alternate" hreflang="x-default" href="https://worldmonitor.app/" />
```

**x-default Usage:**
- Indicates the default version when user's browser language doesn't match any hreflang
- Points to English version in our case
- Best practice for multi-language SEO

### D10: Language Switcher UI

**Decision: Header dropdown with language name + emoji**

```
🌐 [Language ▼]
  ↓
  🌐 English
  🇨🇳 简体中文
  🇹🇰 繁體中文
```

**Rationale:**
- Emoji flags provide visual language identification
- Dropdown accessible and standard pattern
- Placed in header for global access
- No page reload needed on selection

### D11: Async Data Request Handling on Language Switch

**Decision: Refresh all dynamic data when language changes**

**Rationale:**
- Language switch affects all visible UI
- News panels, market panels, status panels need to re-render
- Event-driven architecture allows components to self-refresh

**Implementation:**
```typescript
// Dispatch event on language change
document.dispatchEvent(new CustomEvent('languagechanged'));

// Components listen and re-fetch data as needed
document.addEventListener('languagechanged', () => {
  // Clear current data
  // Re-fetch with new locale headers (if backend needs it)
  // Re-render with new translations
});
```

### D12: Error Handling and Degradation Strategy

**Decision: Global try-catch with graceful degradation**

**Error Handling Layers:**
1. **localStorage errors**: Fall back to browser detection, no user-facing error
2. **Translation file load errors**: Log error, fallback to English-only mode
3. **Runtime translation errors**: Return key, log warning, never crash
4. **Intl API failures**: Fallback to simple string formatting

**Never Crash Strategy:**
```typescript
// i18n engine never throws
// All functions have fallback paths
// Errors are logged but don't propagate to UI
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Panel.ts    │    │ NewsPanel.ts │    │ StatusPanel │   │
│  │              │    │              │    │    .ts      │   │
│  │   t('panel  │    │   t('news   │    │  t('status  )   │
│  │  .loading')  │    │  .noData')  │    │  .health')     │   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘   │
│         │                    │                     │               │
│         └────────────────────┴─────────────────────┘               │
│                              │                                    │
└───────────────────────────────┼────────────────────────────────────┘
                               │
┌───────────────────────────────┼────────────────────────────────────┐
│                     i18n Engine Layer         │
├───────────────────────────────┼────────────────────────────────────┤
│                               │                                    │
│        ┌──────────────────────▼──────────────────────┐           │
│        │  src/i18n/index.ts                        │           │
│        │                                            │           │
│        │  init()                                     │           │
│        │   ├── Load all translation modules (bundled)     │           │
│        │   ├── Handle localStorage errors                   │           │
│        │   ├── Detect browser language                    │           │
│        │   ├── Load saved preference                    │           │)│           │
│        │   └── Call setLanguage()                    │           │
│        │                                            │           │
│        │  setLanguage(locale)                          │           │
│        │   ├── Validate locale                          │           │
│        │   ├── Update localStorage (with error handling)    │           │
│        │   ├── Apply direction (ltr/rtl)                  │           │
│        │   ├── Update html lang attribute                 │           │
│        │   ├── Update hreflang tags                      │           │
│        │   └── Dispatch 'languagechanged' event          │                     │
│        │                                            │           │
│        │  t(key, params)                              │           │
│        │   ├── Get nested value from current locale         │           │
│        │   ├── Fallback to English if missing             │           │
│        │   ├── Interpolate parameters {key}               │           │
│        │   ├── Handle missing parameters                   │           │
│        │   ├── Log warning in dev mode                │           │
│        │   └── Never crash (always return)                │           │
│        │                                            │           │
│        │  formatDateLocale(date, options)                  │           │
│        │  formatNumberLocale(num, options)                  │           │
│        │  formatRelativeTime(date, locale)                │           │
│        │   ├── Calculate time difference                   │           │
│        │   ├── Return locale-specific template              │           │
│        │   └── Handle: 刚刚, X分钟前, X小时前, X天前  │           │
│        │                                            │           │
│        │  getCurrentLocale()                            │           │
│        │  └── Return current locale safely               │           │
│        │                                            │           │
│        │  isRTL(locale) - for future support            │           │
│        └──────────────────────┬──────────────────────┘           │
└───────────────────────────────┼────────────────────────────────────┘
                               │
┌───────────────────────────────┼────────────────────────────────────┐
│                      Translation Data Layer          │
├───────────────────────────────┼────────────────────────────────────┤
│                               │                                    │
│  ┌─────────────┬─────────────┬─────────────┐              │
│  │  en.ts      │  zh-cn.ts   │  zh-tw.ts    │              │
│  │             │             │             │              │
│  │ {           │ {           │ {           │              │
│  │   common: { │   {         │   {         │              │
│  │     loading: │     loading: │     loading:              │
│  │     failed:  │     failed:  │     failed:              │
│  │     noData:  │     noData:  │     noData:              │
│  │     live: 'LIVE' │  live: '实时' │  live: '即時' │ ← Added 'live' key
│  │   },        │   },        │   },        │              │
│  │   panels: { │   panels: { │   panels: { │              │
│  │     ...      │     ...      │     ...      │              │
│  │   },        │   },        │   },        │              │
│  │   panel: {  │   panel: {  │   panel: {  │              │
│  │     ...      │     ...      │     ...      │              │
│  │   },        │   },        │   },        │              │
│  │   time: {    │   time: {    │   time: {    │              │
│  │     justNow:  │     justNow:  │     justNow:  │              │
│  │     minutesAgo:(n)=>...│  (n)=>...  │    (n)=>...  │              │
│  │   },        │   },        │   },        │              │
│  │ }           │ }           │ }           │              │
│  └─────────────┴─────────────┴─────────────┘              │
└───────────────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### i18n Engine Core

```typescript
// src/i18n/index.ts (simplified)
const LOCALE_KEY = 'worldmonitor-locale';
const SUPPORTED_LOCALES = ['en', 'zh-cn', 'zh-tw'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

let currentLocale: Locale = 'en';
let translations: Record<Locale, TranslationData>;

// Safe localStorage wrapper
function getStoredLocale(): Locale | null {
  try {
    return localStorage.getItem(LOCALE_KEY) as Locale;
  } catch (error) {
    console.warn('[i18n] localStorage unavailable:', error);
    return null;
  }
}

// Safe localStorage setter
function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch (error) {
    console.warn('[i18n] Failed to save locale:', error);
    // Don't throw - app still works
  }
}

export function init(): Promise<void> {
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

export function getCurrentLocale(): Locale {
  return currentLocale;
}

// Parameterized translation usage examples:
// t('news.sourceCount', { n: 5 })  → "5 sources" (en) / "5 个来源" (zh-cn) / "5 個來源" (zh-tw)
// t('time.minutesAgo', { n: 10 }) → "10m ago" (en) / "10 分钟前" (zh-cn) / "10 分鐘前" (zh-tw)

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

// Nested path getter
function getNested(obj: any, path: string): any {
  return path.split('.').reduce((current, key) =>
    current?.[key], obj
  );
}

// Browser language detection
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

// Update HTML lang attribute
function updateHtmlLang(): void {
  document.documentElement.setAttribute('lang', currentLocale);
}

// Update hreflang tags
function updateHreflangTags(): void {
  // Remove existing hreflang links
  document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

  const baseUrl = 'https://worldmonitor.app/';
  const locales: Array<{ code: string, label: string }> = [
    { code: 'en', label: 'en' },
    { code: 'zh-CN', label: 'zh-CN' },
    { code: 'zh-TW', label: 'zh-TW' },
  ];

  locales.forEach(({ code, label }) => {
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
```

### Translation File Structure

```typescript
// src/i18n/locales/en.ts
export default {
  common: {
    loading: 'Loading',
    failed: 'Failed to load data',
    noData: 'No data available',
    live: 'LIVE',
    changeLanguage: 'Change language',
  },
  panels: {
    globalMap: 'Global Map',
    liveNews: 'Live News',
    aiInsights: 'AI Insights',
    markets: 'Markets',
    aiStrategicPosture: 'AI Strategic Posture',
    countryInstability: 'Country Instability',
    strategicRiskOverview: 'Strategic Risk Overview',
    intelFeed: 'Intel Feed',
    liveIntelligence: 'Live Intelligence',
    infrastructureCascade: 'Infrastructure Cascade',
    worldNews: 'World News',
    middleEast: 'Middle East',
    africa: 'Africa',
    latinAmerica: 'Latin America',
    asiaPacific: 'Asia-Pacific',
    energyResources: 'Energy & Resources',
    government: 'Government',
    thinkTanks: 'Think Tanks',
    predictions: 'Predictions',
    commodities: 'Commodities',
    economicIndicators: 'Economic Indicators',
    financial: 'Financial',
    technology: 'Technology',
    crypto: 'Crypto',
    sectorHeatmap: 'Sector Heatmap',
    aiMl: 'AI/ML',
    layoffsTracker: 'Layoffs Tracker',
    myMonitors: 'My Monitors',
    fires: 'Fires',
    marketRadar: 'Market Radar',
    btcEtfTracker: 'BTC ETF Tracker',
    stablecoins: 'Stablecoins',
    // Tech variant panels
    globalTechMap: 'Global Tech Map',
    techHeadlines: 'Tech Headlines',
    aiMlNews: 'AI/ML News',
    startupsVc: 'Startups & VC',
    vcInsightsEssays: 'VC Insights & Essays',
    globalStartupNews: 'Global Startup News',
    unicornTracker: 'Unicorn Tracker',
    acceleratorsDemoDays: 'Accelerators & Demo Days',
    cybersecurity: 'Cybersecurity',
    aiPolicyRegulation: 'AI Policy & Regulation',
    aiRegulationDashboard: 'AI Regulation Dashboard',
    techStocks: 'Tech Stocks',
    financialNews: 'Financial News',
    semiconductorsHardware: 'Semiconductors & Hardware',
    cloudInfrastructure: 'Cloud & Infrastructure',
    developerCommunity: 'Developer Community',
    githubTrending: 'GitHub Trending',
    ipoSpac: 'IPO & SPAC',
    techPredictions: 'Tech Predictions',
    fundingVc: 'Funding & VC',
    productHunt: 'Product Hunt',
    techEvents: 'Tech Events',
    serviceStatus: 'Service Status',
    techReadinessIndex: 'Tech Readiness Index',
  },
  panel: {
    resizeTooltip: 'Drag to resize (double-click to reset)',
    summarize: 'Summarize this panel',
    generating: 'Generating summary...',
    newBadge: 'new',
    alert: 'ALERT',
    showMethodology: 'Show methodology info',
  },
  news: {
    noData: 'No news available',
    sources: 'sources',
    also: 'Also:',
    alsoReportedBy: 'Also reported by',
    related: 'Related assets near',
    relatedAssetsNear: 'Related assets near',
    failedToCluster: 'Failed to cluster news',
    sourceCount: (n: number) => `${n} sources`,
    sourcesPerHour: (n: number) => `+${n}/hr`,
    stateMedia: 'State Media',
    caution: 'Caution',
    wire: 'Wire',
    stateAffiliated: 'State-affiliated',
    verifiedOutlet: 'Verified News Outlet',
    wireServiceReliability: 'Wire Service - Highest reliability',
    officialGovernment: 'Official Government Source',
  },
  status: {
    systemStatus: 'System Status',
    systemHealth: 'System Health',
    dataFeeds: 'Data Feeds',
    apiStatus: 'API Status',
    storage: 'Storage',
    updatedJustNow: 'Updated just now',
  },
  playback: {
    toggleMode: 'Toggle Playback Mode',
    historicalPlayback: 'Historical Playback',
  },
  search: {
    placeholder: 'Search...',
    noResults: 'No results found',
  },
  modal: {
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
  },
  time: {
    justNow: 'just now',
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
  countryIntel: {
    loadingIndex: 'Loading index...',
    loadingMarkets: 'Loading prediction markets...',
  },
  cii: {
    scanning: 'Scanning intelligence feeds',
    failedToCalculate: 'Failed to calculate CII',
  },
  cascade: {
    failedToBuild: 'Failed to build dependency graph',
  },
  market: {
    failedToLoad: 'Failed to load market data',
    failedSector: 'Failed to load sector data',
    failedCommodities: 'Failed to load commodities',
  },
};

// src/i18n/locales/zh-cn.ts
export default {
  common: {
    loading: '加载中',
    failed: '加载数据失败',
    noData: '暂无数据',
    live: '实时',
    changeLanguage: '切换语言',
  },
  panels: {
    globalMap: '全球地图',
    liveNews: '实时新闻',
    aiInsights: 'AI 洞察',
    markets: '市场行情',
    aiStrategicPosture: 'AI 战略姿态',
    countryInstability: '国家不稳定性',
    strategicRiskOverview: '战略风险概览',
    intelFeed: '情报源',
    liveIntelligence: '实时情报',
    infrastructureCascade: '基础设施级联',
    worldNews: '世界新闻',
    middleEast: '中东',
    africa: '非洲',
    latinAmerica: '拉丁美洲',
    asiaPacific: '亚太地区',
    energyResources: '能源与资源',
    government: '政府',
    thinkTanks: '智库',
    predictions: '预测市场',
    commodities: '大宗商品',
    economicIndicators: '经济指标',
    financial: '金融',
    technology: '科技',
    crypto: '加密货币',
    sectorHeatmap: '行业热力图',
    aiMl: 'AI/机器学习',
    layoffsTracker: '裁员追踪',
    myMonitors: '我的监控',
    fires: '火灾',
    marketRadar: '市场雷达',
    btcEtfTracker: 'BTC ETF 追踪',
    stablecoins: '稳定币',
    // Tech variant panels
    globalTechMap: '全球科技地图',
    techHeadlines: '科技头条',
    aiMlNews: 'AI/机器学习新闻',
    startupsVc: '初创公司 & 风投',
    vcInsightsEssays: 'VC 洞察与文章',
    globalStartupNews: '全球创业新闻',
    unicornTracker: '独角兽追踪',
    acceleratorsDemoDays: '加速器与路演日',
    cybersecurity: '网络安全',
    aiPolicyRegulation: 'AI 政策与监管',
    aiRegulationDashboard: 'AI 监管仪表板',
    techStocks: '科技股',
    financialNews: '财经新闻',
    semiconductorsHardware: '半导体与硬件',
    cloudInfrastructure: '云与基础设施',
    developerCommunity: '开发者社区',
    githubTrending: 'GitHub 趋势',
    ipoSpac: 'IPO 与 SPAC',
    techPredictions: '科技预测',
    fundingVc: '融资与风投',
    productHunt: 'Product Hunt',
    techEvents: '科技活动',
    serviceStatus: '服务状态',
    techReadinessIndex: '科技就绪指数',
  },
  panel: {
    resizeTooltip: '拖拽调整大小（双击重置）',
    summarize: '总结此面板',
    generating: '正在生成总结...',
    newBadge: '新',
    alert: '警告',
    showMethodology: '显示方法说明',
  },
  news: {
    noData: '暂无新闻',
    sources: '个来源',
    also: '亦：',
    alsoReportedBy: '亦报道于',
    related: '附近相关资产',
    relatedAssetsNear: '附近相关资产',
    failedToCluster: '聚类新闻失败',
    sourceCount: (n: number) => `${n} 个来源`,
    sourcesPerHour: (n: number) => `+${n}/小时`,
    stateMedia: '官方媒体',
    caution: '谨慎',
    wire: '通讯社',
    stateAffiliated: '国家附属',
    verifiedOutlet: '已验证媒体',
    wireServiceReliability: '通讯社 - 最高可靠性',
    officialGovernment: '官方政府来源',
  },
  status: {
    systemStatus: '系统状态',
    systemHealth: '系统健康',
    dataFeeds: '数据源',
    apiStatus: 'API 状态',
    storage: '存储',
    updatedJustNow: '刚刚更新',
  },
  playback: {
    toggleMode: '切换回放模式',
    historicalPlayback: '历史回放',
  },
  search: {
    placeholder: '搜索...',
    noResults: '未找到结果',
  },
  modal: {
    close: '关闭',
    cancel: '取消',
    save: '保存',
  },
  time: {
    justNow: '刚刚',
    minutesAgo: (n: number) => `${n} 分钟前`,
    hoursAgo: (n: number) => `${n} 小时前`,
    daysAgo: (n: number) => `${n} 天前`,
  },
  countryIntel: {
    loadingIndex: '加载索引中...',
    loadingMarkets: '加载预测市场中...',
  },
  cii: {
    scanning: '扫描情报源',
    failedToCalculate: '计算 CII 失败',
  },
  cascade: {
    failedToBuild: '构建依赖图失败',
  },
  market: {
    failedToLoad: '加载市场数据失败',
    failedSector: '加载板块数据失败',
    failedCommodities: '加载大宗商品失败',
  },
};

// src/i18n/locales/zh-tw.ts (Traditional Chinese)
export default {
  common: {
    loading: '加載中',
    failed: '加載數據失敗',
    noData: '暫無數據',
    live: '即時',
    changeLanguage: '切換語言',
  },
  panels: {
    globalMap: '全球地圖',
    liveNews: '即時新聞',
    aiInsights: 'AI 洞察',
    markets: '市場行情',
    aiStrategicPosture: 'AI 戰略姿態',
    countryInstability: '國家不穩定性',
    strategicRiskOverview: '戰略風險概覽',
    intelFeed: '情報源',
    liveIntelligence: '即時情報',
    infrastructureCascade: '基礎設施級聯',
    worldNews: '世界新聞',
    middleEast: '中東',
    africa: '非洲',
    latinAmerica: '拉丁美洲',
    asiaPacific: '亞太地區',
    energyResources: '能源與資源',
    government: '政府',
    thinkTanks: '智庫',
    predictions: '預測市場',
    commodities: '大宗商品',
    economicIndicators: '經濟指標',
    financial: '金融',
    technology: '科技',
    crypto: '加密貨幣',
    sectorHeatmap: '行業熱力圖',
    aiMl: 'AI/機器學習',
    layoffsTracker: '裁員追蹤',
    myMonitors: '我的監控',
    fires: '火災',
    marketRadar: '市場雷達',
    btcEtfTracker: 'BTC ETF 追蹤',
    stablecoins: '穩定幣',
    // Tech variant panels
    globalTechMap: '全球科技地圖',
    techHeadlines: '科技頭條',
    aiMlNews: 'AI/機器學習新聞',
    startupsVc: '初創公司 & 風投',
    vcInsightsEssays: 'VC 洞察與文章',
    globalStartupNews: '全球創業新聞',
    unicornTracker: '獨角獸追蹤',
    acceleratorsDemoDays: '加速器與路演日',
    cybersecurity: '網絡安全',
    aiPolicyRegulation: 'AI 政策與監管',
    aiRegulationDashboard: 'AI 監管儀表板',
    techStocks: '科技股',
    financialNews: '財經新聞',
    semiconductorsHardware: '半導體與硬體',
    cloudInfrastructure: '雲與基礎設施',
    developerCommunity: '開發者社群',
    githubTrending: 'GitHub 趨勢',
    ipoSpac: 'IPO 與 SPAC',
    techPredictions: '科技預測',
    fundingVc: '融資與風投',
    productHunt: 'Product Hunt',
    techEvents: '科技活動',
    serviceStatus: '服務狀態',
    techReadinessIndex: '科技就緒指數',
  },
  panel: {
    resizeTooltip: '拖拽調整大小（雙擊重置）',
    summarize: '總結此面板',
    generating: '正在生成總結...',
    newBadge: '新',
    alert: '警告',
    showMethodology: '顯示方法說明',
  },
  news: {
    noData: '暫無新聞',
    sources: '個來源',
    also: '亦：',
    alsoReportedBy: '亦報道於',
    related: '附近相關資產',
    relatedAssetsNear: '附近相關資產',
    failedToCluster: '聚類新聞失敗',
    sourceCount: (n: number) => `${n} 個來源`,
    sourcesPerHour: (n: number) => `+${n}/小時`,
    stateMedia: '官方媒體',
    caution: '謹慎',
    wire: '通訊社',
    stateAffiliated: '國家附屬',
    verifiedOutlet: '已驗證媒體',
    wireServiceReliability: '通訊社 - 最高可靠性',
    officialGovernment: '官方政府來源',
  },
  status: {
    systemStatus: '系統狀態',
    systemHealth: '系統健康',
    dataFeeds: '數據源',
    apiStatus: 'API 狀態',
    storage: '存儲',
    updatedJustNow: '剛剛更新',
  },
  playback: {
    toggleMode: '切換回放模式',
    historicalPlayback: '歷史回放',
  },
  search: {
    placeholder: '搜尋...',
    noResults: '未找到結果',
  },
  modal: {
    close: '關閉',
    cancel: '取消',
    save: '儲存',
  },
  time: {
    justNow: '剛剛',
    minutesAgo: (n: number) => `${n} 分鐘前`,
    hoursAgo: (n: number) => `${n} 小時前`,
    daysAgo: (n: number) => `${n} 天前`,
  },
  countryIntel: {
    loadingIndex: '加載索引中...',
    loadingMarkets: '加載預測市場中...',
  },
  cii: {
    scanning: '掃描情報源',
    failedToCalculate: '計算 CII 失敗',
  },
  cascade: {
    failedToBuild: '構建依賴圖失敗',
  },
  market: {
    failedToLoad: '加載市場數據失敗',
    failedSector: '加載板塊數據失敗',
    failedCommodities: '加載大宗商品失敗',
  },
};
```

### Language Switcher Integration

```typescript
// src/App.ts - language switcher UI
private initLanguageSwitcher(): void {
  const switcher = document.createElement('div');
  switcher.className = 'language-switcher';

  // Language name mapping
  const languageNames: Record<Locale, string> = {
    en: 'English',
    'zh-cn': '简体中文',
    'zh-tw': '繁體中文',
  };

  // Flag emoji mapping
  const flags: Record<Locale, string> = {
    en: '🌐',
    'zh-cn': '🇨🇳',
    'zh-tw': '🇹🇰',
  };

  switcher.innerHTML = `
    <button class="lang-btn" aria-label="${t('common.changeLanguage')}" aria-haspopup="true">
      <span class="lang-flag">${flags[getCurrentLocale()]}</span>
      <span class="lang-name">${languageNames[getCurrentLocale()]}</span>
      <span class="lang-arrow">▼</span>
    </button>
    <div class="lang-dropdown hidden">
      ${Object.entries(flags).map(([locale, flag]) => `
        <button class="lang-option" data-locale="${locale}">
          <span>${flag}</span> ${languageNames[locale as Locale]}
        </button>
      `).join('')}
    </div>
  `;

  // Handle selection
  switcher.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const locale = btn.dataset.locale as Locale;
      setLanguage(locale);
      render(); // Re-render all components
      switcher.querySelector('.lang-dropdown')?.classList.add('hidden');
    });
  });

  // Update language name on change
  document.addEventListener('languagechanged', () => {
    const nameEl = switcher.querySelector('.lang-name');
    const flagEl = switcher.querySelector('.lang-flag');
    const current = getCurrentLocale();
    nameEl!.textContent = languageNames[current];
    flagEl!.textContent = flags[current];
  });

  // Toggle dropdown
  const toggleBtn = switcher.querySelector('.lang-btn')!;
  const dropdown = switcher.querySelector('.lang-dropdown')!;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target as Node)) {
      dropdown.classList.add('hidden');
    }
  });
}
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|-------|---------|-------------|
| [Translation key typo causes runtime error] | UI shows fallback (good), but confusing | TypeScript types prevent typos; console warnings in dev |
| [Missing Chinese translation] | Shows English text | Acceptable during development; logging helps catch |
| [localStorage corrupted/unavailable] | Language resets to default | Try-catch with warning; fallback to browser detection; no user-facing error |
| [Browser language not supported] | Defaults to English | Graceful degradation; users can manually select |
| [Bundle size increase] | Slightly slower initial load | 15KB overhead is minimal for dashboard app |
| [SEO not immediately indexed] | Search ranking unchanged | Submit sitemap to Google Search Console; hreflang tags help |
| [Date format differences] | Chinese dates look different | Intl API handles correctly; this is desired behavior |
| [Missing parameter in interpolation] | {key} left in output | Log warning; leave placeholder unchanged |
| [User switches language frequently] | No issue | Instant switching by design; no re-fetch overhead |
| [Async data during language switch] | Shows old language briefly | Event-driven refresh; components self-update on languagechanged event |
| [Translation file load failure] | App crashes without handling | Try-catch in init(); fallback to English mode; never crash |
