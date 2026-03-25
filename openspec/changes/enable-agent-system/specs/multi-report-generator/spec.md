# Multi-Report Generator

## ADDED Requirements

### Requirement: Daily AI/Tech report generation
The report generator SHALL create a daily AI/Tech report.

#### Scenario: Tech report generation
- **WHEN** daily-summary task triggers with type 'tech'
- **AND** rss_items contain tech category items
- **THEN** AI summary is generated using LLM
- **AND** report is saved to reports table

### Requirement: Daily World/Geopolitical report generation
The report generator SHALL create a daily World news report.

#### Scenario: World report generation
- **WHEN** daily-summary task triggers with type 'world'
- **AND** rss_items contain world category items
- **THEN** geopolitical summary is generated using LLM
- **AND** report is saved to reports table

### Requirement: Weekly trend analysis
The report generator SHALL create weekly trend analysis.

#### Scenario: Weekly report generation
- **WHEN** weekly-trend task triggers
- **AND** rss_items contain at least 7 days of data
- **THEN** trend analysis is generated
- **AND** report includes major themes, emerging stories, shifts

### Requirement: Report includes metadata
Generated reports SHALL include title, content, category, and time period.

#### Scenario: Report saved
- **WHEN** report is generated successfully
- **AND** saved to database
- **THEN** it includes:
  - title: "Daily Tech Report - YYYY-MM-DD"
  - content: AI-generated Markdown
  - category: 'daily-tech' or 'daily-world'
  - period_start: start of period
  - period_end: end of period
  - format: 'markdown'

### Requirement: Category-based data filtering
Reports SHALL filter rss_items by category.

#### Scenario: Filter by category
- **WHEN** report generation requests category 'tech'
- **AND** rss_items have category stored
- **THEN** only items matching category are used

### Requirement: Web search fallback when data insufficient
The report generator SHALL invoke web search when data is insufficient.

#### Scenario: Data threshold check
- **WHEN** report generation starts
- **AND** rss_items count for category < 50
- **THEN** web-search-agent is triggered
- **AND** report generation waits for补充数据

### Requirement: Report deduplication
The system SHALL prevent duplicate reports for same period.

#### Scenario: Duplicate detection
- **WHEN** report generation is requested for existing period
- **AND** report already exists in database
- **THEN** existing report is returned
- **OR** new generation is skipped with warning

### Requirement: Error handling
Report generation SHALL handle errors gracefully.

#### Scenario: LLM API fails
- **WHEN** LLM API returns error
- **AND** retries are exhausted
- **THEN** error is logged
- **AND** partial data is saved if available
- **AND** task status is marked as 'failed'

### Requirement: Concurrent report generation
Multiple report types SHALL be generated concurrently.

#### Scenario: Parallel generation
- **WHEN** daily task triggers both tech and world reports
- **AND** both have sufficient data
- **THEN** both reports are generated in parallel
