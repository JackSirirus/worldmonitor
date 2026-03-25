# Specification: RSS Cache

## ADDED Requirements

### Requirement: RSS item caching
The system SHALL cache RSS news items in PostgreSQL for persistent storage.

#### Scenario: Fetch RSS feed
- **WHEN** RSS feed is fetched
- **THEN** system SHALL store items in `rss_items` table with title, link, pub_date, source_url

#### Scenario: Duplicate item detection
- **WHEN** new RSS item has same link as existing item
- **THEN** system SHALL NOT create duplicate entry

### Requirement: Automatic fetch interval
The system SHALL automatically fetch RSS feeds at configured intervals.

#### Scenario: Default fetch interval
- **WHEN** no custom interval is set
- **THEN** system SHALL fetch every 2 hours (7200000 ms)

#### Scenario: Source-specific interval
- **WHEN** source has custom `fetch_interval` in `rss_sources` table
- **THEN** system SHALL use that interval instead of default

### Requirement: Force refresh
The system SHALL support immediate fetch when force refresh is requested.

#### Scenario: Force refresh requested
- **WHEN** API is called with `forceRefresh=true`
- **THEN** system SHALL fetch from source immediately regardless of last fetch time

### Requirement: Source availability detection
The system SHALL track and report source availability status.

#### Scenario: Source is available
- **WHEN** RSS feed returns valid items
- **THEN** system SHALL set status to 'ok' in `rss_sources`

#### Scenario: Source is unavailable
- **WHEN** RSS feed request fails (timeout, network error)
- **THEN** system SHALL set status to 'error' with human-readable message in `rss_sources`

#### Scenario: Source returns empty
- **WHEN** RSS feed returns zero items
- **THEN** system SHALL set status to 'warning' in `rss_sources`

### Requirement: Cache expiry
The system SHALL automatically expire cached items after retention period.

#### Scenario: Default retention period
- **WHEN** item is older than 90 days
- **THEN** system SHALL delete item from cache

### Requirement: Response time tracking
The system SHALL record and expose response time for each source.

#### Scenario: Source fetch completes
- **WHEN** RSS feed fetch completes
- **THEN** system SHALL store response time in milliseconds in `rss_sources`
