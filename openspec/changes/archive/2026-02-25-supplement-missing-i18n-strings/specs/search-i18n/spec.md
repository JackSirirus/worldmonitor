# Search i18n Specification

## ADDED Requirements

### Requirement: Search placeholder text shall be variant-specific and translatable
Search input placeholder text SHALL change based on SITE_VARIANT and use translation keys.

#### Scenario: Tech variant search placeholder
- **WHEN** SITE_VARIANT=tech
- **THEN** search placeholder SHALL be translation key `search.placeholderTech` (e.g., "Search companies, AI labs, startups, events...")

#### Scenario: Full variant search placeholder
- **WHEN** SITE_VARIANT=full
- **THEN** search placeholder SHALL be translation key `search.placeholderFull` (e.g., "Search news, pipelines, bases, markets...")

### Requirement: Search hint text shall be translatable
The hint text below search input SHALL use translation key.

#### Scenario: Search hint display
- **WHEN** user views search modal
- **THEN** hint text SHALL use translation key `search.hint`

### Requirement: Search feedback messages shall be translatable
Copy success/failure feedback messages SHALL use translation keys.

#### Scenario: Copy success feedback
- **WHEN** user copies a link successfully
- **THEN** feedback message SHALL use translation key `common.copied`

#### Scenario: Copy failure feedback
- **WHEN** user fails to copy a link
- **THEN** feedback message SHALL use translation key `common.copyFailed`
