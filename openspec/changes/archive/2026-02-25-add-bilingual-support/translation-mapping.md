# Translation Mapping Document

This document provides a mapping of all hardcoded strings that need to be replaced with translation keys.

## Mapping Format

```
File Location
  "Hardcoded String" → t('translation.key')
```

---

## src/components/Panel.ts

```
src/components/Panel.ts:82
  "Show methodology info" → t('panel.showMethodology')

src/components/Panel.ts:260
  "Loading" → t('common.loading')

src/components/Panel.ts:272
  "Failed to load data" → t('common.failed')
```

---

## src/components/NewsPanel.ts

```
src/components/NewsPanel.ts:123
  "Summarize this panel" → t('panel.summarize')

src/components/NewsPanel.ts:179
  "Close" → t('modal.close')

src/components/NewsPanel.ts:232
  "No news available" → t('news.noData')

src/components/NewsPanel.ts:254
  "Failed to cluster news" → t('news.failedToCluster')

src/components/NewsPanel.ts:365
  "State Media" → t('news.stateMedia') - if high risk
  "Caution" → t('news.caution') - if medium risk

src/components/NewsPanel.ts:371
  "Also:" → t('news.also')
  "Also reported by" → t('news.alsoReportedBy')
  "Related assets near" → t('news.relatedAssetsNear')
  "sources" → t('news.sources') - plural noun
  "Wire" → t('news.wire') - tier badge
  "State-affiliated" → t('news.stateAffiliated')
  "Verified News Outlet" → t('news.verifiedOutlet')
  "Wire Service - Highest reliability" → t('news.wireServiceReliability')
  "Official Government Source" → t('news.officialGovernment')
```

---

## src/components/StatusPanel.ts

```
src/components/StatusPanel.ts:57
  "System Status" → t('status.systemStatus')

src/components/StatusPanel.ts:62
  "System Health" → t('status.systemHealth')

src/components/StatusPanel.ts:67
  "Data Feeds" → t('status.dataFeeds')

src/components/StatusPanel.ts:71
  "API Status" → t('status.apiStatus')

src/components/StatusPanel.ts:75
  "Storage" → t('status.storage')

src/components/StatusPanel.ts:80
  "Updated just now" → t('status.updatedJustNow')
```

---

## src/components/PlaybackControl.ts

```
src/components/PlaybackControl.ts:14
  "Toggle Playback Mode" → t('playback.toggleMode')

src/components/PlaybackControl.ts:19
  "Historical Playback" → t('playback.historicalPlayback')

src/components/PlaybackControl.ts:147
  "LIVE" → t('common.live')

src/components/PlaybackControl.ts:276
  (Date formatting) → formatDateLocale(date, options)
```

---

## src/components/MarketPanel.ts

```
src/components/MarketPanel.ts:27
  "Failed to load market data" → t('market.failedToLoad')

src/components/MarketPanel.ts:62
  "Failed to load sector data" → t('market.failedSector')

src/components/MarketPanel.ts:93
  "Failed to load commodities" → t('market.failedCommodities')
```

---

## src/components/EconomicPanel.ts

(Replace loading/error strings with t('common.*'))

---

## src/components/CryptoPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/PredictionPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/MonitorPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/SearchModal.ts

```
src/components/SearchModal.ts
  "Search..." → t('search.placeholder')
```

---

## src/components/SignalModal.ts
(Replace all modal UI strings with t('modal.close'), t('modal.cancel'), t('modal.save'))

---

## src/components/StoryModal.ts
(Replace all modal UI strings with t('modal.*'))

---

## src/components/CountryIntelModal.ts

```
src/components/CountryIntelModal.ts
  "Loading index..." → t('countryIntel.loadingIndex')

src/components/CountryIntelModal.ts
  "Loading prediction markets..." → t('countryIntel.loadingMarkets')
```

---

## src/components/MobileWarningModal.ts
(Replace all modal UI strings with t('modal.*'))

---

## src/components/CIIPanel.ts

```
src/components/CIIPanel.ts:28
  (Description text) → Review for translatable content

src/components/CIIPanel.ts:28
  "Scanning intelligence feeds" → t('cii.scanning')

src/components/CIIPanel.ts:133
  "Failed to calculate CII" → t('cii.failedToCalculate')
```

---

## src/components/CascadePanel.ts
```
src/components/CascadePanel.ts:49
  "Failed to build dependency graph" → t('cascade.failedToBuild')
```

---

## src/components/StrategicRiskPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/StrategicPosturePanel.ts
(Replace all UI strings with t() calls)

---

## src/components/InsightsPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/GdeltIntelPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/LiveNewsPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/TechEventsPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/ServiceStatusPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/TechHubsPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/TechReadinessPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/MacroSignalsPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/ETFFlowsPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/StablecoinPanel.ts
(Replace all UI strings with t() calls)

---

## src/components/SatelliteFiresPanel.ts
(Replace all UI strings with t() calls)

---

## src/config/panels.ts

All panel names need to be replaced with t('panels.*'):

```
src/config/panels.ts (FULL_PANELS):
  "Global Map" → t('panels.globalMap')
  "Live News" → t('panels.liveNews')
  "AI Insights" → t('panels.aiInsights')
  "Strategic Posture" → t('panels.strategicPosture')
  "CII" → t('panels.countryIntel')
  "Strategic Risk Overview" → t('panels.strategicRiskOverview')
  "Intel Feed" → t('panels.intelFeed')
  "Live Intelligence" → t('panels.liveIntelligence')
  "Infrastructure Cascade" → t('panels.infrastructureCascade')
  "World News" → t('panels.worldNews')
  "Middle East" → t('panels.middleEast')
  "Africa" → t('panels.africa')
  "Latin America" → t('panels.latinAmerica')
  "Asia-Pacific" → t('panels.asiaPacific')
  "Energy & Resources" → t('panels.energyResources')
  "Government" → t('panels.government')
  "Think Tanks" → t('panels.thinkTanks')
  "Predictions" → t('panels.predictions')
  "Commodities" → t('panels.commodities')
  "Markets" → t('panels.markets')
  "Economic Indicators" → t('panels.economicIndicators')
  "Financial" → t('panels.financial')
  "Technology" → t('panels.technology')
  "Crypto" → t('panels.crypto')
  "Sector Heatmap" → t('panels.sectorHeatmap')
  "AI/ML" → t('panels.aiMl')
  "Layoffs Tracker" → t('panels.layoffsTracker')
  "My Monitors" → t('panels.myMonitors')
  "Fires" → t('panels.fires')
  "Market Radar" → t('panels.marketRadar')
  "BTC ETF Tracker" → t('panels.btcEtfTracker')
  "Stablecoins" → t('panels.stablecoins')

src/config/panels.ts (TECH_PANELS):
  "Global Tech Map" → t('panels.globalTechMap')
  "Tech Headlines" → t('panels.techHeadlines')
  "AI/ML News" → t('panels.aiMlNews')
  "Technology" → t('panels.technology')
  "Startups & VC" → t('panels.startupsVc')
  "VC Insights & Essays" → t('panels.vcInsightsEssays')
  "Global Startup News" → t('panels.globalStartupNews')
  "Unicorn Tracker" → t('panels.unicornTracker')
  "Accelerators & Demo Days" → t('panels.acceleratorsDemoDays')
  "Cybersecurity" → t('panels.cybersecurity')
  "AI Policy & Regulation" → t('panels.aiPolicyRegulation')
  "AI Regulation Dashboard" → t('panels.aiRegulationDashboard')
  "Tech Stocks" → t('panels.techStocks')
  "Financial News" → t('panels.financialNews')
  "Semiconductors & Hardware" → t('panels.semiconductorsHardware')
  "Cloud & Infrastructure" → t('panels.cloudInfrastructure')
  "Developer Community" → t('panels.developerCommunity')
  "GitHub Trending" → t('panels.githubTrending')
  "IPO & SPAC" → t('panels.ipoSpac')
  "Tech Predictions" → t('panels.techPredictions')
  "Funding & VC" → t('panels.fundingVc')
  "Product Hunt" → t('panels.productHunt')
  "Tech Events" → t('panels.techEvents')
  "Service Status" → t('panels.serviceStatus')
  "Tech Readiness Index" → t('panels.techReadinessIndex')
```

---

## Notes

- Use regex to find all hardcoded strings: `['"]([A-Z][a-zA-Z\s.,?!'-]+)['"]`
- Panel names in src/config/panels.ts need dynamic lookup based on SITE_VARIANT
- Review each file manually to ensure no strings are missed
- Test in all three languages after replacement

### Dynamic (Parameterized) Translation Keys

The following translation keys accept parameters and use function syntax in translation files:

```typescript
// In translation files (en.ts, zh-cn.ts, zh-tw.ts)
news: {
  sourceCount: (n: number) => `${n} sources`,      // e.g., "5 sources"
  sourcesPerHour: (n: number) => `+${n}/hr`,          // e.g., "+12/hr"
},
time: {
  minutesAgo: (n: number) => `${n}m ago`,          // e.g., "5m ago"
  hoursAgo: (n: number) => `${n}h ago`,             // e.g., "2h ago"
  daysAgo: (n: number) => `${n}d ago`,              // e.g., "1d ago"
},
```

**Usage in components:**
```typescript
// For parameterized translations, pass parameter as an object:
t('news.sourceCount', { n: 5 })      // Returns "5 sources" or "5 个来源"
t('time.minutesAgo', { n: 10 })      // Returns "10m ago" or "10 分钟前"
```

Note: These are defined in translation files with function syntax but are not listed in above mapping sections since they are called dynamically with parameters rather than as static string replacements.
