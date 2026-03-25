# Scheduler Integration

## ADDED Requirements

### Requirement: Scheduler initializes on server startup
The scheduler SHALL be automatically initialized when the Express server starts.

#### Scenario: Server starts successfully
- **WHEN** Express server starts on port 3001
- **THEN** scheduler.initializeScheduler() is called
- **AND** all defined cron tasks are registered

### Requirement: Scheduler stops gracefully on shutdown
The scheduler SHALL stop all tasks gracefully when server receives SIGTERM or SIGINT.

#### Scenario: Server receives shutdown signal
- **WHEN** process receives SIGTERM or SIGINT
- **AND** scheduler.stopScheduler() is called
- **THEN** all registered cron tasks are stopped
- **AND** server closes connections

### Requirement: Scheduled tasks execute at configured times
Each defined task SHALL execute at its configured cron schedule.

#### Scenario: Daily summary task runs
- **WHEN** cron expression `0 6 * * *` triggers (6:00 UTC daily)
- **THEN** daily-summary task executes
- **AND** report generator creates daily report

#### Scenario: Weekly trend task runs
- **WHEN** cron expression `0 6 * * 0` triggers (Sunday 6:00 UTC)
- **AND** weekly-trend task executes
- **AND** report generator creates weekly report

#### Scenario: Cleanup task runs
- **WHEN** cron expression `0 4 * * *` triggers (4:00 UTC daily)
- **THEN** cleanup task executes
- **AND** old RSS items and podcasts are deleted

#### Scenario: Backup task runs
- **WHEN** cron expression `0 3 * * *` triggers (3:00 UTC daily)
- **THEN** backup task executes
- **AND** database is backed up to local/cloud storage

### Requirement: Manual task trigger
Users SHALL be able to manually trigger any scheduled task via API.

#### Scenario: User triggers daily summary
- **WHEN** POST /api/agent/trigger/daily-summary is called
- **THEN** daily-summary task executes immediately
- **AND** response indicates task was triggered

### Requirement: Task execution logging
All task executions SHALL be logged with appropriate level and context.

#### Scenario: Task starts execution
- **WHEN** any scheduled task begins
- **THEN** log entry with INFO level and task name is created

#### Scenario: Task fails
- **WHEN** any scheduled task throws an error
- **THEN** log entry with ERROR level and error details is created
