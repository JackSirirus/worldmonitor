# News Storage Specification

## ADDED Requirements

### Requirement: Bilingual News Storage
The system SHALL store news in both English and Chinese.

#### Scenario: Store news with translation
- **WHEN** new news is collected
- **THEN** the system immediately translates the title to Chinese
- **AND** stores both original and translated versions in the database
- **AND** marks the translation status as "completed"

#### Scenario: Query news by language
- **WHEN** a user queries news with language filter
- **THEN** the system returns news in the requested language

---

### Requirement: News Deduplication
The system SHALL prevent duplicate news using MD5(title+url) as unique identifier.

#### Scenario: Detect duplicate news
- **WHEN** new news is about to be stored
- **THEN** the system calculates MD5 hash of title+url
- **AND** checks if the hash already exists in the database
- **AND** skips storage if duplicate is found

#### Scenario: Allow duplicate with different content
- **WHEN** news has same URL but different title
- **THEN** the system treats it as a new entry
- **AND** stores with new hash

---

### Requirement: News Clustering
The system SHALL cluster related news using Jaccard similarity.

#### Scenario: Cluster similar news
- **WHEN** news items are processed
- **THEN** the system tokenizes titles
- **AND** calculates Jaccard similarity
- **AND** groups items with similarity >= 0.5 into the same cluster

#### Scenario: Update cluster on new news
- **WHEN** new news is added
- **THEN** the system checks similarity against existing clusters
- **AND** adds to existing cluster or creates new cluster

---

### Requirement: Incremental Update
The system SHALL support incremental updates rather than full refresh.

#### Scenario: Incremental news collection
- **WHEN** RSS collection runs
- **THEN** the system only fetches new items since last collection
- **AND** updates existing items if content changed
- **AND** does not delete existing data

#### Scenario: Track collection timestamp
- **WHEN** collection completes
- **THEN** the system records the timestamp
- **AND** uses it for next incremental collection

---

### Requirement: Automatic Data Cleanup
The system SHALL automatically clean up expired data based on retention policies.

#### Scenario: Clean up expired news
- **WHEN** the cleanup task runs (daily at 3 AM)
- **THEN** the system deletes news older than 2 months
- **AND** logs the cleanup operation

#### Scenario: Clean up expired reports
- **WHEN** the cleanup task runs
- **THEN** the system deletes reports older than 1 month
- **AND** logs the cleanup operation

---

### Requirement: News Classification
The system SHALL classify news into categories.

#### Scenario: Auto-categorize news
- **WHEN** new news is stored
- **THEN** the system assigns a category based on source or content
- **AND** stores the category with the news

#### Scenario: Query news by category
- **WHEN** a user queries news with category filter
- **THEN** the system returns only news in that category

---

### Requirement: Frontend Database-first News Loading
The system SHALL provide news to frontend exclusively from database.

#### Scenario: Frontend loads news from database
- **WHEN** frontend needs to display news
- **THEN** it calls GET /api/news with pagination
- **AND** receives news items from rss_items table
- **AND** includes source, title, pub_date, category

#### Scenario: Frontend checks refresh status
- **WHEN** frontend initializes
- **THEN** it calls GET /api/rss-collector/refresh-needed
- **AND** checks if any source hasn't been fetched in 30 minutes
- **AND** triggers POST /api/rss-collector/collect if needed

#### Scenario: Background refresh while user browses
- **WHEN** frontend detects stale sources
- **THEN** it triggers RSS collection in background
- **AND** user sees existing data immediately
- **AND** new data appears after next refresh

---

### Requirement: Source Tiers Storage
The system SHALL store source tier information in database for unified management.

#### Scenario: Source tiers in database
- **WHEN** RSS sources are synced
- **THEN** tier information is stored in rss_sources table
- **AND** tier levels (1-4) indicate source reliability

#### Scenario: Frontend fetches tiers from backend
- **WHEN** frontend needs source tier information
- **THEN** it calls GET /api/source-tiers
- **AND** receives tier mapping from database (not frontend config)

---

### Requirement: News Clustering Storage
The system SHALL compute and store news clusters in database.

#### Scenario: Cluster news items
- **WHEN** clustering job runs
- **THEN** similar news items are grouped together
- **AND** cluster_id is stored in rss_items table

#### Scenario: Frontend fetches clusters
- **WHEN** frontend needs clustered news
- **THEN** it calls GET /api/news/clusters
- **AND** receives pre-computed clusters from database
