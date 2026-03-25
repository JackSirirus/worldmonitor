# RSS Collector Agent

## ADDED Requirements

### Requirement: RSS sources are fetched periodically
The RSS collector SHALL fetch all configured RSS sources at a defined interval.

#### Scenario: RSS collector runs on schedule
- **WHEN** cron expression `*/30 * * * *` triggers (every 30 minutes)
- **THEN** all active RSS sources are fetched
- **AND** new items are extracted from each feed

### Requirement: RSS sources have category assignment
Each RSS source SHALL have a category for report classification.

#### Scenario: Tech category mapping
- **WHEN** RSS source is from TECH_FEEDS config
- **AND** source has category 'tech', 'ai', or 'startup'
- **THEN** item is stored with category 'tech'

#### Scenario: World category mapping
- **WHEN** RSS source is from WORLD_FEEDS config
- **AND** source has category 'world', 'geopolitical', or 'military'
- **THEN** item is stored with category 'world'

### Requirement: Duplicate items are not inserted
The RSS collector SHALL prevent duplicate items based on link URL.

#### Scenario: Duplicate item detected
- **WHEN** RSS item with existing link is encountered
- **THEN** item is skipped without insertion

### Requirement: Items are stored with metadata
Collected RSS items SHALL be stored with source, title, link, description, and publication date.

#### Scenario: New item is collected
- **WHEN** RSS feed contains new item
- **THEN** item is inserted into rss_items table
- **AND** source_url references the source feed
- **AND** pub_date is parsed from RSS entry
- **AND** fetched_at records collection time

### Requirement: Source status is tracked
The RSS collector SHALL track the fetch status of each source.

#### Scenario: Source fetch succeeds
- **WHEN** RSS source returns valid feed
- **AND** items are extracted
- **THEN** source status is updated to 'ok'
- **AND** response_time is recorded

#### Scenario: Source fetch fails
- **WHEN** RSS source returns error or times out
- **THEN** source status is updated to 'error'
- **AND** error_message is recorded

### Requirement: Incremental fetch
The RSS collector SHALL only fetch recent items (not full history).

#### Scenario: Fetching recent items
- **WHEN** RSS feed is fetched
- **AND** source has last_fetch timestamp
- **THEN** only items newer than last_fetch are processed

### Requirement: Category filtering
RSS collector SHALL support filtering by source category.

#### Scenario: Category specified
- **WHEN** RSS collector is called with category parameter
- **AND** category matches rss_sources.category
- **THEN** only sources in that category are fetched

### Requirement: Parallel fetching
RSS sources SHALL be fetched in parallel for performance.

#### Scenario: Multiple sources fetched
- **WHEN** RSS collector runs with multiple sources
- **THEN** sources are fetched concurrently (max 10 parallel)
- **AND** overall completion time is minimized

### Requirement: Fetch interval is configurable
The RSS collector fetch interval SHALL be configurable via agent config.

#### Scenario: Config changed
- **WHEN** agent config is updated with rssFetchInterval = 60
- **AND** scheduler is restarted
- **THEN** cron schedule runs every 60 minutes

### Requirement: Frontend can check if refresh is needed
The RSS collector SHALL provide an API endpoint to check if any source needs refreshing.

#### Scenario: Frontend checks refresh status
- **WHEN** frontend calls GET `/api/rss-collector/refresh-needed`
- **AND** any source has last_fetch older than 30 minutes
- **THEN** response includes `needsRefresh: true`
- **AND** `staleSourceCount` indicates how many sources need refresh

### Requirement: Frontend triggers background refresh
The RSS collector SHALL allow frontend to trigger a refresh via API.

#### Scenario: Frontend triggers collection
- **WHEN** frontend calls POST `/api/rss-collector/collect`
- **AND** sources need refreshing
- **THEN** RSS collection runs in background
- **AND** response includes number of items collected

### Requirement: All news fetched from database
Frontend SHALL fetch all news from the database via `/api/news` endpoint, not from RSS proxy.

#### Scenario: Frontend loads news
- **WHEN** user refreshes page
- **AND** frontend calls `/api/news?page=1&limit=100`
- **THEN** news items are returned from database
- **AND** includes source, title, pub_date, category

### Requirement: Frontend auto-refresh on page load
Frontend SHALL automatically check RSS source timestamps and trigger refresh if needed.

#### Scenario: Page load with stale data
- **WHEN** user loads the page
- **AND** frontend calls `/api/rss-collector/refresh-needed`
- **AND** response shows `needsRefresh: true`
- **THEN** frontend triggers POST `/api/rss-collector/collect` in background
- **AND** continues to load existing news from database

