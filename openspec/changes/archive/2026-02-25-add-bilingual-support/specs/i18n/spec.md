# Internationalization (i18n) Specification

## ADDED Requirements

### Requirement: Language detection and initialization
The system SHALL automatically detect user's browser language and initialize to appropriate locale on first visit.

#### Scenario: First visit with browser set to Chinese
- **WHEN** user visits WorldMonitor for the first time with `navigator.language = 'zh-CN'`
- **THEN** system initializes with Simplified Chinese locale
- **AND** all UI elements display in Chinese
- **AND** `<html lang="zh-CN">` attribute is set

#### Scenario: First visit with browser set to English
- **WHEN** user visits WorldMonitor for the first time with `navigator.language = 'en-US'`
- **THEN** system initializes with English locale
- **AND** `<html lang="en">` attribute is set

#### Scenario: Browser language not supported
- **WHEN** user's browser language is not in supported locales (e.g., 'fr-FR')
- **THEN** system defaults to English locale
- **AND** logs a warning message

#### Scenario: zh locale defaults to Simplified Chinese
- **WHEN** browser language is 'zh' (without country code)
- **THEN** system defaults to 'zh-cn' (Simplified Chinese)
- **AND** logs a debug message

#### Scenario: zh-Hant locale maps to Traditional Chinese
- **WHEN** browser language is 'zh-Hant'
- **THEN** system initializes with 'zh-tw' (Traditional Chinese)
- **AND** `<html lang="zh-TW">` attribute is set

### Requirement: Language preference persistence
The system SHALL store user's selected language preference in localStorage.

#### Scenario: User selects Chinese language
- **WHEN** user selects "简体中文" from language switcher
- **THEN** system saves 'zh-cn' to localStorage with key 'worldmonitor-locale'

#### Scenario: User returns to site
- **WHEN** user returns to WorldMonitor after having previously selected Chinese
- **THEN** system reads 'worldmonitor-locale' from localStorage
- **AND** initializes with Chinese locale without requiring user re-selection

#### Scenario: localStorage corrupted
- **WHEN** localStorage read fails (quota exceeded, corrupted data)
- **THEN** system gracefully falls back to browser language detection
- **AND** system does not crash
- **AND** system logs a warning to console

#### Scenario: localStorage unavailable
- **WHEN** localStorage is disabled (private browsing mode)
- **THEN** system gracefully falls back to browser language detection
- **AND** system does not crash
- **AND** system does NOT show user-facing error

### Requirement: Language switching
The system SHALL allow users to switch between supported languages without page reload.

#### Scenario: Switch from English to Chinese
- **WHEN** user clicks language switcher and selects "简体中文"
- **THEN** system updates current locale to 'zh-cn'
- **AND** all visible UI text changes to Chinese immediately
- **AND** browser does not reload page
- **AND** language preference is saved to

#### Scenario: Switch from Chinese to English
- **WHEN** user clicks language switcher and selects "English"
- **THEN** system updates current locale to 'en'
- **AND** all visible UI text changes to English immediately
- **AND** browser does not reload page

### Requirement: Translation lookup with fallback
The system SHALL provide a translation function that returns to appropriate text for the current locale.

#### Scenario: Existing translation key
- **WHEN** code calls `t('common.loading')` with locale set to 'zh-cn'
- **THEN** function returns '加载中'

#### Scenario: Missing translation in current locale
- **WHEN** code calls `t('nonexistent.key')` with locale set to 'zh-cn' (key missing in Chinese)
- **THEN** function falls back to English translation
- **AND** function logs a warning in console

#### Scenario: Key missing in all locales
- **WHEN** code calls `t('truly.nonexistent.key')` (missing in all locales)
- **THEN**** function returns key itself 'truly.nonexistent.key'
- **AND** function logs an error in console

#### Scenario: Key not found in Chinese but exists in English
- **WHEN** code calls `t('some.key')` where key exists only in English
- **THEN** function returns English translation
- **AND** function logs a warning about missing Chinese translation

### Requirement: Parameter interpolation
The translation function SHALL support parameter interpolation for dynamic values.

#### Scenario: Single parameter interpolation
- **WHEN** code calls `t('greeting', { name: 'World' })`
- **AND** English translation is 'Hello, {name}!'
- **THEN** function returns 'Hello, World!'

#### Scenario: Multiple parameter interpolation
- **WHEN** code calls `t('userCount', { count: 5, max: 10 })`
- **AND** English translation is 'Users: {count}/{max}'
- **THEN** function returns 'Users: 5/10'

#### Scenario: Missing parameter
- **WHEN** code calls `t('greeting', { wrongParam: 'test' })`
- **AND** translation contains '{name}'
- **THEN** function leaves '{name}' unchanged in output
' - **AND** function logs a warning about missing parameter

#### Scenario: Parameter type mismatch (number instead of string)
- **WHEN** code calls `t('message', { count: 5 })` where translation expects string
- **THEN** function converts parameter to string automatically
- **AND** function returns template with '5' substituted

### Requirement: Date and time formatting
The system SHALL format dates and times according to current locale.

#### Scenario: English date format
- **WHEN** current locale is 'en'
- **AND** code calls `formatDateLocale(new Date('2024-02-13'))`
- **THEN** function returns a string like 'February 13, 2024' or 'Feb 13, 2024'

#### Scenario: Simplified Chinese date format
- **WHEN** current locale is 'zh-cn'
- **AND** code calls `formatDateLocale(new Date('2024-02-13'))`
- **THEN** function returns a string like '2024年2月13日'

#### Scenario: Traditional Chinese date format
- **WHEN** current locale is 'zh-tw'
- **AND** code calls `formatDateLocale(new Date('2024-02-13'))`
- **THEN** function returns a string like '2024年2月13日'

#### Scenario: Short date format
- **WHEN** code calls `formatDateLocale(date, { month: 'short', day: 'numeric' })`
- **THEN** en: 'Feb 13', zh-CN: '2月13日', zh-TW: '2月13日'

#### Scenario: English time format (12-hour)
- **WHEN** current locale is 'en'
- **AND** code calls `formatTimeLocale(new Date('2024-02-13T14:30:00'))`
- **THEN** function returns '2:30 PM' or similar format

#### Scenario: Chinese time format (24-hour)
- **WHEN** current locale is 'zh-CN' or 'zh-TW'
- **AND** code calls `formatTimeLocale(new Date('2024-02-13T14:30:00'))`
- **THEN** function returns '14:30' (24-hour format preferred in Chinese contexts)

### Requirement: Relative time formatting
The system SHALL provide relative time strings (e.g., "5 minutes ago") based on current locale.

#### Scenario: Recent time in English (seconds)
- **WHEN** current locale is 'en'
- **AND** time difference is less than 60 seconds
- **THEN** function returns 'just now'

#### Scenario: Recent time in English (minutes)
- **WHEN** current locale is 'en'
- **AND** time difference is 5 minutes (300 seconds)
- **THEN** function returns '5m ago' or '5 minutes ago'

#### Scenario: Recent time in English (hours)
- **WHEN** current locale is 'en'
- **AND** time difference is 2 hours (7200 seconds)
- **THEN** function returns '2h ago' or '2 hours ago'

#### Scenario: Recent time in English (days)
- **WHEN** current locale is 'en'
- **AND** time difference is 3 days
- **THEN** function returns '3d ago' or '3 days ago'

#### Scenario: Recent time in Simplified Chinese (seconds)
- **WHEN** current locale is 'zh-cn'
- **AND** time difference is less than 60 seconds
- **THEN** function returns '刚刚'

#### Scenario: Recent time in Simplified Chinese (minutes)
- **WHEN** current locale is 'zh-cn'
- **AND** time difference is 5 minutes
- **THEN** function returns '5 分钟前'

#### Scenario: Recent time in Simplified Chinese (hours)
- **WHEN** current locale is 'zh-cn'
- **'** time difference is 2 hours
- **THEN** function returns '2 小时前'

#### Scenario: Recent time in Simplified Chinese (days)
- **WHEN** current locale is 'zh-cn'
- **AND** time difference is 3 days
- **THEN** function returns '3 天前'

#### Scenario: Recent time in Traditional Chinese (seconds)
- **WHEN** current locale is 'zh-tw'
- **AND** time difference is less than 60 seconds
- **THEN** function returns '剛剛'

#### Scenario: Recent time in Traditional Chinese (minutes)
- **WHEN** current locale is 'zh-tw'
- **AND** time difference is 5 minutes
- **THEN** function returns '5 分鐘前'

#### Scenario: Recent time in Traditional Chinese (hours)
- **WHEN** current locale is 'zh-tw'
- **AND** time difference is 2 hours
- **THEN** function returns '2 小時前'

#### Scenario: Recent time in Traditional Chinese (days)
- **WHEN** current locale is 'zh-tw'
- **AND** time difference is 3 days
- **THEN** function returns '3 天前'

### Requirement: Number formatting
The system SHALL format numbers according to current locale conventions.

#### Scenario: Large number formatting with thousands separator
- **WHEN** current locale is 'zh-cn'
- **AND** code calls `formatNumberLocale(1234567.89)`
- **THEN** function returns '1,234,567.89' (with appropriate thousands separator)

#### Scenario: Number formatting with decimal places
- **WHEN** current locale is 'en'
- **AND** code calls `formatNumberLocale(1234.567, { maximumFractionDigits: 2 })`
- **THEN** function returns '1,234.57'

### Requirement: Type-safe translation keys
The translation system SHALL provide TypeScript definitions for all available translation keys.

#### Scenario: Type checking prevents invalid key
- **WHEN** developer calls `t('invalid.key.path')`
- **THEN** TypeScript shows type error if key doesn't exist in translation type definition

#### Scenario: Auto-completion for keys
- **WHEN** developer types `t('`
- **THEN** IDE shows auto-completion for all available translation keys

### Requirement: RTL direction support preparation
The system SHALL support RTL (right-to-left) text direction for future language additions.

#### Scenario: Current LTR languages
- **WHEN** current locale is 'en', 'zh-cn', or 'zh-tw'
- **THEN** `<html>` element has `dir="ltr"` attribute
- **AND** document body has no 'rtl' class

#### Scenario: Future RTL language
- **WHEN** current locale is set to an RTL language (e.g., 'ar-SA')
- **THEN** `<html>` element has `dir="rtl"` attribute
- **AND** document body has 'rtl' class for CSS targeting

### Requirement: LIVE label definition
The translation system SHALL provide a LIVE label for playback controls and status indicators.

#### Scenario: LIVE label in English
- **WHEN** code calls `t('common.live')` with locale 'en'
- **THEN** function returns 'LIVE'

#### Scenario: LIVE label in Simplified Chinese
- **WHEN** code calls `t('common.live')` with locale 'zh-cn'
- **THEN** function returns '实时'

#### Scenario: LIVE label in Traditional Chinese
- **WHEN** code calls `t('common.live')` with locale 'zh-tw'
- **THEN** function returns '即時'

### Requirement: Error handling and graceful degradation
The translation system SHALL never crash the application and always provide fallback behavior.

#### Scenario: Translation load failure handled gracefully
- **WHEN** translation module fails to load
- **THEN** system logs an error to console
- **AND** system falls back to English-only mode
- **AND** application continues to function

#### Scenario: Runtime translation error does not crash
- **WHEN** an error occurs during translation lookup
- **THEN** system logs error and returns the key itself
- **AND** application continues to function

#### Scenario: Missing translation shows English fallback
- **WHEN** a translation key is missing in current locale
- **THEN** system returns English translation if available
- **AND** system returns the key itself if English also missing
- **AND** system logs a warning for developers
