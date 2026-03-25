# Design: Supplement Missing i18n Strings

## Context

The bilingual support infrastructure (i18n) is already in place with:
- i18n engine in src/i18n/index.ts
- Three locale files (en.ts, zh-cn.ts, zh-tw.ts)
- Translation function `t()` available globally
- titleKey support for panel components

However, code audit revealed hardcoded English strings in several files that bypass the translation system.

## Goals / Non-Goals

**Goals:**
- Identify and translate all remaining hardcoded English UI strings
- Maintain consistency with existing i18n naming conventions
- Ensure all three locales (en, zh-cn, zh-tw) are updated

**Non-Goals:**
- No changes to i18n infrastructure itself
- No new translation features or capabilities
- Content/news data remains untranslated (as designed)
- No RTL support (out of scope)

## Decisions

### Translation Key Organization
- Use nested namespace structure following existing conventions
- Map-related: `map.layers.*`, `map.legend.*`, `map.tooltip.*`, `map.activity.*`
- Search-related: `search.placeholder*`, `search.hint`
- Panel auxiliary: `panel.*` namespace where appropriate

### String Extraction Priority
1. User-visible labels (highest priority)
2. Tooltips and descriptions
3. Error messages
4. Console/debug strings (lowest priority - can remain in English)

## Risks / Trade-offs

- **Risk**: Some strings contain dynamic content (e.g., "Major cable" + variable)
  - **Mitigation**: Use template literals with translation keys for static parts

- **Risk**: Large number of strings to translate
  - **Mitigation**: Group by file/component to make review manageable

## Open Questions

- Should we translate the layer help text (currently very long)?
- Should we add translation for the "LAST UPDATE" prefix in Map.ts timestamp?
