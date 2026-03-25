# Local Variant Links - Tasks

## 1. Create variant runtime getter function

- [x] 1.1 Modify src/config/index.ts - export getVariant() function instead of SITE_VARIANT constant
- [x] 1.2 Update src/config/feeds.ts - use getVariant() for FEEDS selection
- [x] 1.3 Update src/config/panels.ts - use getVariant() for panel/layers selection

## 2. Update components to use getVariant()

- [x] 2.1 Update src/App.ts - replace all SITE_VARIANT imports with getVariant()
- [x] 2.2 Update src/components/DeckGLMap.ts - replace SITE_VARIANT with getVariant()
- [x] 2.3 Update src/components/InsightsPanel.ts - replace SITE_VARIANT with getVariant()
- [x] 2.4 Update src/components/Map.ts - replace SITE_VARIANT with getVariant()
- [x] 2.5 Update src/components/NewsPanel.ts - replace SITE_VARIANT with getVariant()
- [x] 2.6 Update src/components/StatusPanel.ts - replace SITE_VARIANT with getVariant()
- [x] 2.7 Update src/components/LiveNewsPanel.ts - remove duplicate definition, use getVariant()

## 3. Update services to use getVariant()

- [x] 3.1 Update src/services/summarization.ts - replace SITE_VARIANT with getVariant()
- [x] 3.2 Update src/services/polymarket.ts - replace SITE_VARIANT with getVariant()
- [x] 3.3 Update src/services/rss.ts - replace SITE_VARIANT with getVariant()

## 4. Modify variant button links in App.ts

- [x] 4.1 Add getOtherVariantUrl() function to build URLs with variant parameter
- [x] 4.2 Use current hostname + port from window.location
- [x] 4.3 Append `?variant=xxx` (or `&variant=xxx` if params exist)
- [x] 4.4 Preserve existing URL parameters (lang, lat, lon, zoom, etc.)
- [x] 4.5 Update both WORLD and TECH button hrefs to use getOtherVariantUrl()

## 5. Add URL parameter parsing for variant

- [x] 5.1 Update getVariant() to check for 'variant' URL parameter
- [x] 5.2 URL parameter takes precedence over compiled value
- [x] 5.3 Store variant preference in localStorage for persistence (optional)
