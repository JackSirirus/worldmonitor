# Database Schema Specification

## ADDED Requirements

### Requirement: News Table
The system SHALL have a news table for storing news articles.

#### Scenario: Create news table
- **WHEN** the database is initialized
- **THEN** a news table is created with required columns
- **AND** indexes are created for optimized queries

#### Scenario: News table columns
- **WHEN** news is stored
- **THEN** the following fields are saved:
  - id (MD5 hash of title+url, primary key)
  - title (original title)
  - title_zh (translated title)
  - content (article content)
  - summary (AI-generated summary)
  - source (news source name)
  - url (original URL)
  - published_at (publication date)
  - lang (language code: en/zh)
  - category (news category)
  - cluster_id (cluster reference)
  - created_at (storage timestamp)
  - updated_at (last update timestamp)

#### Scenario: News table indexes
- **WHEN** the news table is created
- **THEN** indexes are created on: title, source, lang, category
- **AND** composite index on (category, published_at)

---

### Requirement: Report Table
The system SHALL have a report table for storing generated reports.

#### Scenario: Create report table
- **WHEN** the database is initialized
- **THEN** a reports table is created with required columns

#### Scenario: Report table columns
- **WHEN** a report is stored
- **THEN** the following fields are saved:
  - id (UUID, primary key)
  - title (report title)
  - content (report content)
  - category (report category)
  - generated_at (generation timestamp)
  - created_at (storage timestamp)

---

### Requirement: Task Table
The system SHALL have a task table for storing agent task information.

#### Scenario: Create task table
- **WHEN** the database is initialized
- **THEN** a tasks table is created with required columns

#### Scenario: Task table columns
- **WHEN** a task is created
- **THEN** the following fields are saved:
  - id (UUID, primary key)
  - type (task type: rss-collect, translate, report, etc.)
  - status (pending/running/completed/failed)
  - progress (0-100)
  - result (task result JSON)
  - error (error message if failed)
  - started_at (start timestamp)
  - completed_at (completion timestamp)
  - created_at (creation timestamp)

---

### Requirement: Log Table
The system SHALL have a log table for storing application and task logs.

#### Scenario: Create log table
- **WHEN** the database is initialized
- **THEN** a logs table is created with required columns

#### Scenario: Log table columns
- **WHEN** a log entry is stored
- **THEN** the following fields are saved:
  - id (UUID, primary key)
  - level (log level: info/warn/error/debug)
  - message (log message)
  - context (JSON with service, taskId, etc.)
  - created_at (timestamp)

---

### Requirement: Tool Configuration Table
The system SHALL have a table for storing tool configurations.

#### Scenario: Create tool config table
- **WHEN** the database is initialized
- **THEN** a tools table is created with required columns

#### Scenario: Tool config table columns
- **WHEN** a tool is registered
- **THEN** the following fields are saved:
  - id (UUID, primary key)
  - name (tool name, unique)
  - version (tool version)
  - type (tool type: rss, ai, search, etc.)
  - config (JSON configuration)
  - enabled (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

---

### Requirement: Index Optimization
The system SHALL create appropriate indexes for query performance.

#### Scenario: Index on news.title
- **WHEN** queries filter by title
- **THEN** the index on title column speeds up the query

#### Scenario: Index on news.source
- **WHEN** queries filter by source
- **THEN** the index on source column speeds up the query

#### Scenario: Index on news.lang
- **WHEN** queries filter by language
- **THEN** the index on lang column speeds up the query

#### Scenario: Index on news.category
- **WHEN** queries filter by category
- **THEN** the index on category column speeds up the query
