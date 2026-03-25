## Why

WorldMonitor currently only supports English, limiting accessibility to global users. As a geopolitical and tech intelligence platform, bilingual support (Chinese/English) will:
- Expand reach to Chinese-speaking users (Mainland China, Taiwan, Hong Kong, Singapore, etc.)
- Improve user experience for international visitors
- Better align with the global nature of the platform

## What Changes

### Core Changes
- Add i18n infrastructure with custom lightweight engine
- Implement language switcher in page header (dropdown)
- Support three languages: English (en), Simplified Chinese (zh-CN), Traditional Chinese (zh-TW)
- Auto-detect browser language on first visit
- Persist user's language preference in localStorage

### UI Translation Scope
- Translate all panel titles (~30+ panels)
- Translate common UI elements (buttons, labels, tooltips)
- Translate status messages and error messages
- **Preserve original language** for news content and data feeds

### Localization Features
- Date/time formatting based on locale
- Number formatting based on locale
- RTL preparation (architectural, not initially enabled)
- Fallback to English for missing translations

### SEO Improvements
- Add `hreflang` tags for all language versions
- Create sitemap.xml with language alternates
- Update `<html lang="...">` attribute dynamically

## Capabilities

### New Capabilities
- `i18n`: Internationalization infrastructure providing language detection, switching, and translation lookup
- `language-preference`: User language preference management with localStorage persistence
- `localized-datetime`: Date/time and number formatting based on current locale
- `bilingual-seo`: SEO optimization for multi-language support (hreflang, sitemap)

### Modified Capabilities
(None - no existing spec files in project)

## Impact

### Code Changes
- **New files (5)**:
  - `src/i18n/index.ts` - i18n engine core
  - `src/i18n/types.ts` - TypeScript definitions
  - `src/i18n/locales/en.ts` - English translations
  - `src/i18n/locales/zh-cn.ts` - Simplified Chinese translations
  - `src/i18n/locales/zh-tw.ts` - Traditional Chinese translations

**Note**: TypeScript type definitions are defined inline in `src/i18n/index.ts` using `typeof SUPPORTED_LOCALES[number]` pattern. No separate `types.ts` file is needed.

- **Modified files (35+)**:
  - `src/main.ts` - Initialize i18n on startup
  - `src/App.ts` - Add language switcher UI
  - `index.html` - Add dynamic lang attribute
  - `src/components/Panel.ts` - Base panel UI strings
  - `src/components/NewsPanel.ts` - News-specific strings
  - `src/components/StatusPanel.ts` - Status panel strings
  - `src/components/PlaybackControl.ts` - Playback control strings
  - `src/config/panels.ts` - All panel names
  - `src/components/MarketPanel.ts` - Market panel strings
  - `src/components/EconomicPanel.ts` - Economic indicator strings
  - `src/components/CryptoPanel.ts` - Crypto panel strings
  - `src/components/PredictionPanel.ts` - Prediction market strings
  - `src/components/MonitorPanel.ts` - Monitor panel strings
  - `src/components/SearchModal.ts` - Search modal strings
  - `src/components/SignalModal.ts` - Signal modal strings
  - `src/components/StoryModal.ts` - Story modal strings
  - `src/components/CountryIntelModal.ts` - Country intel strings
  - `src/components/MobileWarningModal.ts` - Mobile warning strings
  - `src/components/CIIPanel.ts` - CII panel strings
  - `src/components/CascadePanel.ts` - Cascade panel strings
  - `src/components/StrategicRiskPanel.ts` - Strategic risk strings
  - `src/components/StrategicPosturePanel.ts` - Strategic posture strings
  - `src/components/InsightsPanel.ts` - Insights panel strings
  - `src/components/GdeltIntelPanel.ts` - GDELT intel strings
  - `src/components/LiveNewsPanel.ts` - Live news strings
  - `src/components/TechEventsPanel.ts` - Tech events strings
  - `src/components/ServiceStatusPanel.ts` - Service status strings
  - `src/components/TechHubsPanel.ts` - Tech hubs strings
  - `src/components/TechReadinessPanel.ts` - Tech readiness strings
  - `src/components/MacroSignalsPanel.ts` - Macro signals strings
  - `src/components/ETFFlowsPanel.ts` - ETF flows strings
  - `src/components/StablecoinPanel.ts` - Stablecoin panel strings
  - `src/components/SatelliteFiresPanel.ts` - Satellite fires strings

- **New configuration**:
  - `public/sitemap.xml` - SEO sitemap with language alternates
  - `vercel.json` - URL rewrite rules (optional, for /zh-cn/ paths)

### Dependencies
- No new npm packages required (custom lightweight implementation)
- Uses native `Intl` API for date/number formatting

### Performance Impact
- Bundle size increase: ~15KB (3 translation files + i18n engine)
- All translations loaded synchronously (fast language switching)
- No runtime translation overhead (simple object lookup)

### SEO Impact
- Better indexing for Chinese language searches
- Search engines can serve correct language version to users
- hreflang tags indicate language alternates properly
