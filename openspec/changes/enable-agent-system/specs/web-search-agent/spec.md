# Web Search Agent

> **Note**: This agent uses Tavily or Serper API for web search (MiniMax does not have web search capability).

## ADDED Requirements

### Requirement: Web search triggers when data is insufficient
The web search agent SHALL be triggered when rss_items data is below threshold.

#### Scenario: Insufficient data detected
- **WHEN** report generator checks rss_items count
- **AND** count is less than 50 for the target category
- **THEN** web search agent is invoked to supplement data

### Requirement: Search returns relevant results
The web search agent SHALL return news articles relevant to the target category.

#### Scenario: Tech news search
- **WHEN** web search is called with category 'tech'
- **THEN** search returns AI, technology, startup news
- **AND** results include title, url, snippet, published date

#### Scenario: World news search
- **WHEN** web search is called with category 'world'
- **THEN** search returns geopolitical, military, international news
- **AND** results include title, url, snippet, published date

### Requirement: Search results are stored
Web search results SHALL be stored in database for report generation.

#### Scenario: Search completes
- **WHEN** web search API returns results
- **AND** results are processed
- **THEN** items are inserted into rss_items table
- **AND** source_url indicates 'web-search' source

### Requirement: Rate limiting is respected
The web search agent SHALL respect API rate limits.

#### Scenario: Rate limit approached
- **WHEN** API returns rate limit error
- **THEN** agent waits and retries with exponential backoff
- **AND** maximum 3 retries per request

### Requirement: Search is configurable
Maximum search count SHALL be configurable to control costs.

#### Scenario: Custom search limit
- **WHEN** web search is called with max_results parameter
- **AND** value is between 1 and 20
- **THEN** search returns up to specified number of results

### Requirement: Fallback when search fails
The system SHALL handle search failures gracefully.

#### Scenario: Search API unavailable
- **WHEN** web search API returns error
- **AND** retries are exhausted
- **THEN** report generation continues with existing data
- **AND** warning is logged

### Requirement: Language-specific search
The web search agent SHALL support language-specific searches.

#### Scenario: Chinese search
- **WHEN** search is called with language 'zh'
- **THEN** search returns Chinese-language results

#### Scenario: English search
- **WHEN** search is called with language 'en'
- **THEN** search returns English-language results
