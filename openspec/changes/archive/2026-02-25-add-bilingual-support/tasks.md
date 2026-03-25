# Bilingual Support Implementation Tasks

**Note**: See `translation-mapping.md` for complete mapping of all hardcoded strings to translation keys.

## String Extraction Tool

A helper script `scripts/extract-i18n-strings.cjs` is available to scan the codebase and find all hardcoded English strings that need translation. This tool generates a report (`translation-extraction-report.md`) with:

- File location and line number for each string
- Suggested translation namespace and key
- Count of translatable strings by namespace

**Usage**:
```bash
node scripts/extract-i18n-strings.cjs
```

This tool can be used as a reference to verify that all UI strings have been properly identified and mapped in `translation-mapping.md`.

## 1. i18n Infrastructure Setup

- [x] 1.1 Create src/i18n directory structure
- [x] 1.2 Create src/i18n/index.ts with core i18n engine
  - [x] Define TypeScript types inline (Locale, TranslationData, etc.)
  - [x] Implement detectBrowserLocale() function
  - [x] Implement setLanguage(locale) function
  - [x] Implement t(key, params) function with fallback
  - [x] Implement formatDateLocale(date, options) function
  - [x] Implement formatNumberLocale(num, options) function
  - [x] Implement formatRelativeTime(date, locale) function
  - [x] Implement init() async function
  - [x] Add error handling and console warnings for missing keys

## 2. Translation Files Creation

- [x] 2.1 Create src/i18n/locales/en.ts with all English translations
  - [x] Add common namespace (loading, failed, noData, live, changeLanguage)
  - [x] Add panels namespace (all ~60 panel names for both full + tech variants)
  - [x] Add panel namespace (tooltips, buttons, status messages)
  - [x] Add news namespace (noData, sources, also, alsoReportedBy, related, etc.)
  - [x] Add status namespace (system status strings)
  - [x] Add playback namespace (time controls)
  - [x] Add search namespace (search UI strings)
  - [x] Add modal namespace (modal dialogs)
  - [x] Add time namespace (relative time strings)
- [x] 2.2 Create src/i18n/locales/zh-cn.ts with Simplified Chinese translations
  - [x] Translate all English strings to Simplified Chinese
  - [x] Ensure proper terminology (e.g., 亦： vs 亦报道于)
- [x] 2.3 Create src/i18n/locales/zh-tw.ts with Traditional Chinese translations
  - [x] Convert Simplified Chinese to Traditional Chinese
  - [x] Use proper Traditional terminology where applicable

## 3. Application Integration

- [x] 3.1 Update src/main.ts to initialize i18n on startup
  - [x] Import init from i18n module
  - [x] Call init() before App initialization
  - [x] Handle init errors gracefully
- [x] 3.2 Update index.html to support dynamic lang
  - [x] Ensure proper charset and meta tags
  - [x] Add placeholder for hreflang tags
- [x] 3.3 Update src/App.ts to integrate i18n
  - [x] Import t and language functions from i18n
  - [x] Add language switcher UI component
  - [x] Implement language switcher dropdown with flags
  - [x] Wire up language change event listeners
  - [x] Call render() on language change

## 4. Core Components Migration

- [x] 4.1 Update src/components/Panel.ts
  - [x] Uses t() for loading/failed messages
  - [x] Supports titleKey for dynamic title translation
  - [x] Listens to languagechanged event
- [x] 4.2 Update src/components/NewsPanel.ts
  - [x] Import i18n and use t() for all UI strings

## 5. Status Components Migration

- [x] 5.1 Update src/components/StatusPanel.ts
  - [x] Uses t() for status strings
- [x] 5.2 Update src/components/PlaybackControl.ts
  - [x] Uses t() for playback strings

## 6. Panel Configuration Migration

- [x] 6.1 Update src/config/panels.ts (via App.ts)
  - [x] App.ts uses getPanelName() for dynamic panel name translation
  - [x] getPanelTitleKey() maps panel IDs to translation keys

## 7. Market Components Migration

- [x] 7.1 Update src/components/MarketPanel.ts
  - [x] Uses titleKey for MarketPanel, HeatmapPanel, CommoditiesPanel, CryptoPanel
- [x] 7.2 CryptoPanel.ts (handled in MarketPanel.ts)
- [x] 7.3 Update src/components/EconomicPanel.ts
  - [x] Uses titleKey for panel title

## 8. Modal Components Migration

- [x] 8.1 Update src/components/SearchModal.ts
  - [x] Uses t() for search placeholder
- [x] 8.2 Update src/components/SignalModal.ts
  - [x] Uses t() for modal strings
- [x] 8.3 Update src/components/StoryModal.ts
  - [x] Uses t() for modal strings
- [x] 8.4 Update src/components/CountryIntelModal.ts
  - [x] Uses t() for loading strings

## 9. Remaining Panel Components Migration

- [x] 9.1 Update src/components/PredictionPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.2 Update src/components/MonitorPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.3 Update src/components/CIIPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.4 Update src/components/CascadePanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.5 Update src/components/StrategicRiskPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.6 Update src/components/StrategicPosturePanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.7 Update src/components/InsightsPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.8 Update src/components/GdeltIntelPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.9 Update src/components/LiveNewsPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.10 Update src/components/TechEventsPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.11 Update src/components/ServiceStatusPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.12 Update src/components/TechHubsPanel.ts
  - [x] Added titleKey for panel title
  - [x] Added panels.techHubs translation key
- [x] 9.13 Update src/components/TechReadinessPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.14 Update src/components/MacroSignalsPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.15 Update src/components/ETFFlowsPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.16 Update src/components/StablecoinPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.17 Update src/components/SatelliteFiresPanel.ts
  - [x] Uses titleKey for panel title
- [x] 9.18 Update src/components/MobileWarningModal.ts
  - [x] Uses t() for modal strings

## 10. SEO Optimization

- [x] 10.1 Create public/sitemap.xml
  - [x] Add main URL entry
  - [x] Add xhtml:link elements for zh-CN and zh-TW
  - [x] Add x-default hreflang element
  - [x] Ensure proper XML namespaces
- [x] 10.2 Update src/services/meta-tags.ts (integrated in i18n/index.ts)
  - [x] Add updateLocaleMetaTags(locale) function
  - [x] Implement hreflang tag injection (including x-default)
  - [x] Update canonical URL dynamically
  - [x] Call meta tag update on language change

## 11. CSS and Styling

- [x] 11.1 Update src/styles/main.css for language switcher
  - [x] Add language switcher dropdown styles
  - [x] Add language flag emoji styles
  - [x] Add dropdown animation styles
- [x] 11.2 Prepare for RTL support (architectural)
  - [x] Review all absolute positioning
  - [x] Review all margin-left/right usage
  - [x] Consider logical properties (margin-inline-start)

## 12. Testing

- [x] 12.1 Manual testing - English locale
  - [x] Verify all UI displays in English
  - [x] Test language switcher functionality
  - [x] Verify localStorage persistence
  - [x] Check console for missing translation warnings
- [x] 12.2 Manual testing - Simplified Chinese locale
  - [x] Switch to zh-cn and verify translation
  - [x] Check for text overflow or truncation
  - [x] Verify date formatting in Chinese
  - [x] Verify number formatting
- [x] 12.3 Manual testing - Traditional Chinese locale
  - [x] Switch to zh-tw and verify translation
  - [x] Check text rendering quality
  - [x] Verify character correctness
- [x] 12.4 Cross-browser testing
  - [x] Test in Chrome
  - [x] Test in Firefox
  - [x] Test in Safari
  - [x] Test in Edge
- [x] 12.5 SEO testing
  - [x] Verify hreflang tags are present
  - [x] Verify sitemap.xml is accessible
  - [x] Check <html lang> attribute updates correctly

## 13. Documentation

- [x] 13.1 Update README.md
  - [x] Add section about bilingual support
  - [x] Document how to add new translations
  - [x] Document translation key conventions
- [x] 13.2 Create CLAUDE.md section update
  - [x] Bilingual support rules already added
  - [x] Document developer quick reference guide

## 14. Developer Reference Materials

- [x] 14.1 Created translation-mapping.md with string mappings
  - See translation-mapping.md for complete mapping of all hardcoded strings
  - Includes file locations, line numbers, and suggested translation keys
