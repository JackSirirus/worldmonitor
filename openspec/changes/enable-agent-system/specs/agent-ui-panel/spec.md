# Agent UI Panel

## ADDED Requirements

### Requirement: Agent status panel displays system status
The frontend SHALL show current agent system status.

#### Scenario: Panel loads
- **WHEN** Agent panel component mounts
- **AND** fetches /api/agent/status
- **THEN** displays:
  - Scheduler status (running/stopped)
  - Last task execution times
  - Active tasks count

### Requirement: Task history is displayed
The UI SHALL show history of agent task executions.

#### Scenario: View task history
- **WHEN** user navigates to Agent panel
- **AND** GET /api/agent/tasks is called
- **THEN** list of recent tasks is displayed
- **AND** each entry shows: task name, status, start time, duration

### Requirement: Task status indicators
Each task SHALL show visual status indicator.

#### Scenario: Task status shown
- **WHEN** task list is rendered
- **AND** task has status 'completed'
- **THEN** green checkmark is displayed

- **WHEN** task has status 'running'
- **THEN** spinner/progress indicator is displayed

- **WHEN** task has status 'failed'
- **AND** red error icon is displayed

### Requirement: Manual task trigger button
Users SHALL be able to manually trigger tasks from UI.

#### Scenario: Trigger task
- **WHEN** user clicks "Generate Report" button
- **AND** selects report type (tech/world)
- **AND** confirms action
- **THEN** POST /api/agent/trigger is called
- **AND** success notification is shown

### Requirement: Report list displays generated reports
The UI SHALL show all generated reports.

#### Scenario: View reports
- **WHEN** user clicks "Reports" tab
- **AND** GET /api/reports is called
- **THEN** list of reports is displayed
- **AND** each shows: title, category, date, preview

### Requirement: Report detail view
Users SHALL be able to view full report content.

#### Scenario: View report detail
- **WHEN** user clicks on report
- **AND** GET /api/reports/:id is called
- **THEN** full Markdown content is rendered

### Requirement: Podcast player
The UI SHALL include audio player for podcasts.

#### Scenario: Play podcast
- **WHEN** user clicks play on podcast item
- **AND** audio file exists
- **THEN** audio player loads
- **AND** user can play/pause/seek

### Requirement: Language toggle for reports
Users SHALL be able to switch report language.

#### Scenario: Toggle language
- **WHEN** user selects language option
- **AND** clicks "Generate"
- **THEN** report is generated in selected language
- **AND** TTS uses matching voice

### Requirement: Auto-refresh for task status
The UI SHALL periodically refresh task status.

#### Scenario: Auto-refresh
- **WHEN** Agent panel is visible
- **AND** 30 seconds have passed
- **THEN** task list is automatically refreshed

### Requirement: Error messages displayed
Failed tasks SHALL show error details.

#### Scenario: View error
- **WHEN** user clicks on failed task
- **AND** task has error_message
- **THEN** error details are displayed in modal

### Requirement: Responsive design
Agent panel SHALL work on desktop and tablet.

#### Scenario: Mobile view
- **WHEN** screen width < 768px
- **THEN** panel layout adjusts to single column
- **AND** touch-friendly controls
