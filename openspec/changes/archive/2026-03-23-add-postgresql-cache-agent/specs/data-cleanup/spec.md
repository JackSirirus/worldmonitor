# Specification: Data Cleanup

## ADDED Requirements

### Requirement: Automatic RSS item cleanup
The system SHALL automatically delete RSS items older than retention period.

#### Scenario: Cleanup execution
- **WHEN** daily cleanup task runs
- **AND** items exist older than 90 days
- **THEN** system SHALL delete those items from `rss_items`

### Requirement: Retention period configuration
The system SHALL support configurable retention period.

#### Scenario: Custom retention period
- **WHEN** `RSS_RETENTION_DAYS` environment variable is set
- **THEN** system SHALL use that value instead of default (90)

#### Scenario: Default retention
- **WHEN** no retention period is configured
- **THEN** system SHALL use default 90 days

### Requirement: Agent results preservation
The system SHALL preserve agent analysis results even when RSS items are deleted.

#### Scenario: RSS item deleted
- **WHEN** old RSS item is deleted
- **AND** agent task reference exists
- **THEN** agent task records SHALL NOT be deleted

#### Scenario: Report preservation
- **WHEN** RSS items are cleaned up
- **AND** reports exist that reference those items
- **THEN** reports SHALL be preserved

### Requirement: Podcast cleanup
The system SHALL automatically delete old podcasts.

#### Scenario: Podcast retention
- **WHEN** podcast is older than 3 days
- **THEN** system SHALL delete audio file
- **AND** remove record from `podcasts` table

#### Scenario: Podcast retention configuration
- **WHEN** `PODCAST_RETENTION_DAYS` is set
- **THEN** system SHALL use that value instead of default (3)

### Requirement: Cleanup logging
The system SHALL log cleanup operations.

#### Scenario: Cleanup runs
- **WHEN** cleanup task executes
- **THEN** system SHALL log:
  - Number of RSS items deleted
  - Number of podcasts deleted
  - Execution time

### Requirement: Orphan cleanup
The system SHALL clean up orphaned records.

#### Scenario: Remove orphaned items
- **WHEN** cleanup runs
- **AND** rss_items exist with non-existent source_url
- **THEN** system SHALL delete orphaned items
