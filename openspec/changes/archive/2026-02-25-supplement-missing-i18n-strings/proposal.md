# Supplement Missing i18n Strings

## Why

The initial bilingual support implementation (change: add-bilingual-support) covered most UI strings, but a code audit revealed several hardcoded English strings in map components, search functionality, and auxiliary panels that are still displayed in English regardless of the user's selected language. This reduces the effectiveness of the localization effort and creates an inconsistent user experience.

## What Changes

- Add translation keys and translations for map layer labels in DeckGLMap.ts and Map.ts
- Add translation keys for search placeholder text and hints in App.ts
- Add translation keys for RegulationPanel tab labels
- Add translation keys for VerificationChecklist labels
- Add translation keys for IntelligenceGapBadge descriptions
- Add translation keys for miscellaneous panel descriptions (GeoHubsPanel, TechHubsPanel, CascadePanel)
- Add translation keys for map tooltip and status labels
- Update the three locale files (en.ts, zh-cn.ts, zh-tw.ts) with all new translations

## Capabilities

### New Capabilities
- `map-layer-labels`: Translation keys for all map layer toggle labels and legend items
- `search-i18n`: Translation keys for search placeholder text and hints
- `panel-misc-labels`: Translation keys for various panel auxiliary labels and descriptions

### Modified Capabilities
- (None - this is a continuation of the existing i18n capability)

## Impact

- Files to modify: src/i18n/locales/en.ts, zh-cn.ts, zh-tw.ts
- Files to review: App.ts, Map.ts, DeckGLMap.ts, RegulationPanel.ts, VerificationChecklist.ts, IntelligenceGapBadge.ts, TechEventsPanel.ts, GeoHubsPanel.ts, TechHubsPanel.ts, CascadePanel.ts
- No API or behavioral changes - purely UI string localization
