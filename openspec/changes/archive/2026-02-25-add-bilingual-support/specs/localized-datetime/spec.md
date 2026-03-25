# Localized Date/Time Formatting Specification

## ADDED Requirements

### Requirement: Date formatting by locale
The system SHALL format dates according to the current locale's conventions.

#### Scenario: Full date in English locale
- **WHEN** current locale is 'en'
- **AND** code calls `formatDateLocale(new Date('2024-02-13T10:30:00'))`
- **THEN** function returns a string like 'February 13, 2024' or 'Feb 13, 2024'

#### Scenario: Full date in Simplified Chinese locale
- **WHEN** current locale is 'zh-cn'
- **AND** code calls `formatDateLocale(new Date('2024-02-13T10:30:00'))`
- **THEN** function returns a string like '2024年2月13日'

#### Scenario: Full date in Traditional Chinese locale
- **WHEN** current locale is 'zh-tw'
- **AND** code calls `formatDateLocale(new Date('2024-02-13T10:30:00'))`
- **THEN** function returns a string like '2024年2月13日'

#### Scenario: Short date format
- **WHEN** code calls `formatDateLocale(date, { month: 'short', day: 'numeric' })`
- **THEN** en: 'Feb 13', zh-CN: '2月13日', zh-TW: '2月13日'

### Requirement: Time formatting by locale
The system SHALL format times according to the current locale's conventions.

#### Scenario: 12-hour time in English locale
- **WHEN** current locale is 'en'
- **AND** code calls `formatTimeLocale(new Date('2024-02-13T14:30:00'))`
- **THEN** function returns '2:30 PM' or similar format

#### Scenario: 24-hour time in Chinese locale
- **WHEN** current locale is 'zh-cn' or 'zh-tw'
- **AND** code calls `formatTimeLocale(new Date('2024-02-13T14:30:00'))`
- **THEN** function returns '14:30' (24-hour format preferred in Chinese contexts)

### Requirement: Relative time formatting
The system SHALL provide relative time strings (e.g., "5 minutes ago").

#### Scenario: Recent time in English
- **WHEN** current locale is 'en'
- **AND** time difference is 5 minutes
- **THEN** function returns '5m ago' or '5 minutes ago'

#### Scenario: Recent time in Chinese
- **WHEN** current locale is 'zh-cn'
- **AND** time difference is 5 minutes
- **THEN** function returns '5分钟前'

#### Scenario: Recent time in Traditional Chinese
- **WHEN** current locale is 'zh-tw'
- **AND** time difference is 5 minutes
- **THEN** function returns '5分鐘前'

#### Scenario: Very recent time
- **WHEN** time difference is less than 60 seconds
- **THEN** function returns 'just now' (en), '刚刚' (zh-CN), '剛剛' (zh-TW)

### Requirement: Number formatting by locale
The system SHALL format numbers with appropriate thousand separators.

#### Scenario: Large number in English locale
- **WHEN** current locale is 'en'
- **AND** code calls `formatNumberLocale(1234567.89)`
- **THEN** function returns '1,234,567.89' (comma as thousands separator)

#### Scenario: Large number in Chinese locale
- **WHEN** current locale is 'zh-cn' or 'zh-tw'
- **AND** code calls `formatNumberLocale(1234567.89)`
- **THEN** function returns '1,234,567.89' (comma also used in Chinese)
