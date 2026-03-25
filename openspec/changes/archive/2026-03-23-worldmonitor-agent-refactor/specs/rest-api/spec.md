# RESTful API Specification

## ADDED Requirements

### Requirement: News API
The system SHALL provide RESTful APIs for news operations.

#### Scenario: Get news list
- **WHEN** client calls GET /api/news with pagination
- **THEN** the system returns a paginated list of news
- **AND** supports filters: category, source, lang, date range

#### Scenario: Get single news
- **WHEN** client calls GET /api/news/:id
- **THEN** the system returns the news item with full details

#### Scenario: Search news
- **WHEN** client calls GET /api/news/search?q=keyword
- **THEN** the system returns matching news items
- **AND** ranks results by relevance

#### Scenario: News includes threat classification
- **WHEN** client calls GET /api/news
- **THEN** each news item includes threat_level and threat_category
- **AND** classification is done on server-side (keyword-based, no AI API needed)

---

### Requirement: Source Tiers API
The system SHALL provide APIs for news source tier management.

#### Scenario: Get source tiers
- **WHEN** client calls GET /api/source-tiers
- **THEN** returns list of all RSS sources with their tier levels
- **AND** tiers are stored in database (migrated from frontend config)

---

### Requirement: News Clusters API
The system SHALL provide APIs for news clustering results.

#### Scenario: Get news clusters
- **WHEN** client calls GET /api/news/clusters
- **THEN** returns grouped news items by similarity
- **AND** clustering is computed on backend

---

### Requirement: RSS Collector API
The system SHALL provide RESTful APIs for RSS collection management.

#### Scenario: Check if refresh is needed
- **WHEN** client calls GET /api/rss-collector/refresh-needed
- **AND** any RSS source has last_fetch older than 30 minutes
- **THEN** returns {needsRefresh: true, staleSourceCount: N}
- **AND** returns lastFetchTime and thresholdMinutes

#### Scenario: Trigger RSS collection
- **WHEN** client calls POST /api/rss-collector/collect
- **THEN** triggers RSS collection for all active sources
- **AND** returns {success: true, collected: N, errors: N}

#### Scenario: Get RSS sources status
- **WHEN** client calls GET /api/rss-collector/status
- **THEN** returns list of all RSS sources with status
- **AND** includes last_fetch, error_message, response_time

#### Scenario: Sync RSS sources
- **WHEN** client calls POST /api/rss-collector/sync-all
- **THEN** syncs all predefined RSS feeds to database
- **AND** returns number of sources synced

---

### Requirement: Report API
The system SHALL provide RESTful APIs for report operations.

#### Scenario: Get report list
- **WHEN** client calls GET /api/reports
- **THEN** the system returns a list of reports
- **AND** supports filters: category, date range

#### Scenario: Get single report
- **WHEN** client calls GET /api/reports/:id
- **THEN** the system returns the report with full content

---

### Requirement: Task API
The system SHALL provide RESTful APIs for task operations.

#### Scenario: Trigger a task
- **WHEN** client calls POST /api/tasks with task type and params
- **THEN** the system creates a new task
- **AND** returns the task ID

#### Scenario: Get task status
- **WHEN** client calls GET /api/tasks/:id
- **THEN** the system returns the task status and progress

#### Scenario: List tasks
- **WHEN** client calls GET /api/tasks
- **THEN** the system returns a list of tasks
- **AND** supports filters: status, type, date range

---

### Requirement: Tool API
The system SHALL provide RESTful APIs for tool management.

#### Scenario: List tools
- **WHEN** client calls GET /api/tools
- **THEN** the system returns a list of registered tools

#### Scenario: Register tool
- **WHEN** client calls POST /api/tools with tool definition
- **THEN** the system registers the new tool
- **AND** returns the tool ID

#### Scenario: Update tool
- **WHEN** client calls PUT /api/tools/:id with updated config
- **THEN** the system updates the tool configuration

#### Scenario: Delete tool
- **WHEN** client calls DELETE /api/tools/:id
- **THEN** the system marks the tool as disabled

---

### Requirement: No User Authentication
The system SHALL NOT require user authentication for API access.

#### Scenario: Access API without auth
- **WHEN** client makes an API request without authentication
- **THEN** the system processes the request normally

---

### Requirement: Automatic Data Cleanup
The system SHALL include automatic cleanup of expired data.

#### Scenario: Scheduled cleanup
- **WHEN** the cleanup scheduled task runs
- **THEN** the system deletes news older than 2 months
- **AND** deletes reports older than 1 month

---

### Requirement: API Response Format
The system SHALL use consistent JSON response format.

#### Scenario: Success response
- **WHEN** an API request succeeds
- **THEN** the system returns JSON with data field

#### Scenario: Error response
- **WHEN** an API request fails
- **THEN** the system returns JSON with error field
- **AND** includes appropriate HTTP status code
