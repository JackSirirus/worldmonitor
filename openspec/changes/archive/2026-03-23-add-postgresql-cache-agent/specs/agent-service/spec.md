# Specification: Agent Service

## ADDED Requirements

### Requirement: Scheduled task execution
The system SHALL support scheduled execution of agent tasks.

#### Scenario: Daily summary task
- **WHEN** scheduled time is reached (configurable, default 6:00 UTC)
- **THEN** system SHALL execute daily news summary generation

#### Scenario: Weekly report task
- **WHEN** scheduled time for weekly report is reached (Sunday 6:00 UTC)
- **THEN** system SHALL execute weekly trend analysis and report generation

### Requirement: News summarization
The system SHALL generate AI-powered summaries of recent news.

#### Scenario: Generate category summary
- **WHEN** category is specified
- **AND** news items exist for that category
- **THEN** system SHALL generate summary using configured AI provider

#### Scenario: Summary stored
- **WHEN** summary is generated
- **THEN** system SHALL store in `agent_tasks` table with type 'summary'

### Requirement: Trend analysis
The system SHALL analyze news trends over time periods.

#### Scenario: Weekly trend analysis
- **WHEN** weekly task runs
- **THEN** system SHALL analyze news from past 7 days
- **AND** identify emerging topics, sentiment changes

#### Scenario: Trend results stored
- **WHEN** trend analysis completes
- **THEN** system SHALL store results in `agent_tasks` table with type 'trend'

### Requirement: Markdown report generation
The system SHALL generate Markdown format reports.

#### Scenario: Generate daily report
- **WHEN** daily report task runs
- **THEN** system SHALL create Markdown report with summaries
- **AND** store in `reports` table

#### Scenario: Report accessible via URL
- **WHEN** report is requested via `/api/reports/:id`
- **THEN** system SHALL return Markdown content

### Requirement: Podcast generation with Edge TTS
The system SHALL generate audio podcasts using Microsoft Edge TTS.

#### Scenario: Generate podcast from report
- **WHEN** report generation completes
- **AND** podcast is enabled
- **THEN** system SHALL convert report to audio using Edge TTS
- **AND** store in `podcasts` table

#### Scenario: Podcast accessible via URL
- **WHEN** podcast is requested via `/api/podcasts/:id`
- **THEN** system SHALL return audio file (mp3)

#### Scenario: Edge TTS unavailable
- **WHEN** Edge TTS API fails
- **THEN** system SHALL log error
- **AND** mark task as failed
- **AND** NOT block other tasks

### Requirement: Task status tracking
The system SHALL track and report task execution status.

#### Scenario: Task starts
- **WHEN** agent task begins execution
- **THEN** system SHALL create record with status 'running'

#### Scenario: Task completes successfully
- **WHEN** agent task completes
- **THEN** system SHALL update status to 'completed'

#### Scenario: Task fails
- **WHEN** agent task encounters error
- **THEN** system SHALL update status to 'failed'
- **AND** store error message
