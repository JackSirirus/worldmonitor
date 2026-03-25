# Task Scheduler Specification

## ADDED Requirements

### Requirement: Task Queue
The system SHALL use Bull queue for task management.

#### Scenario: Create task in queue
- **WHEN** a task is triggered
- **THEN** the task is added to the Bull queue
- **AND** assigned a unique job ID

#### Scenario: Process task from queue
- **WHEN** a worker is available
- **THEN** the task is dequeued
- **AND** executed by the worker

---

### Requirement: Cron Scheduling
The system SHALL support Cron expressions for scheduled tasks.

#### Scenario: RSS collection schedule
- **WHEN** cron time "*/30 * * * *" is reached
- **THEN** RSS collection task is automatically triggered
- **AND** runs every 30 minutes

#### Scenario: Translation schedule
- **WHEN** cron time "*/15 * * * *" is reached
- **THEN** pending translation task is triggered
- **AND** runs every 15 minutes

#### Scenario: Report generation schedule
- **WHEN** cron time "0 6 * * *" is reached
- **THEN** daily report generation is triggered
- **AND** runs at 6 AM daily

#### Scenario: Cleanup schedule
- **WHEN** cron time "0 3 * * *" is reached
- **THEN** data cleanup task is triggered
- **AND** runs at 3 AM daily

#### Scenario: Backup schedule
- **WHEN** cron time "0 3 * * *" is reached
- **THEN** database backup task is triggered
- **AND** runs at 3 AM daily

---

### Requirement: Manual Task Trigger
The system SHALL support manually triggering tasks via API.

#### Scenario: Trigger task via API
- **WHEN** client calls POST /api/tasks/trigger
- **THEN** a new task is created and queued
- **AND** task ID is returned to client

#### Scenario: Trigger with parameters
- **WHEN** client triggers task with custom parameters
- **THEN** the parameters are passed to the task handler
- **AND** task executes with provided parameters

---

### Requirement: Progress Tracking
The system SHALL track and report task progress.

#### Scenario: Report progress
- **WHEN** task handler updates progress
- **THEN** the progress is stored in the database
- **AND** pushed to WebSocket subscribers

#### Scenario: Query progress
- **WHEN** client queries task status
- **THEN** the current progress is returned
- **AND** includes current stage information

---

### Requirement: Task Retry
The system SHALL automatically retry failed tasks.

#### Scenario: Retry configuration
- **WHEN** a task is configured with retry
- **THEN** failed attempts are automatically retried
- **AND** respects maximum retry count

#### Scenario: Exponential backoff
- **WHEN** a task fails and needs retry
- **THEN** the delay follows exponential backoff (2s, 4s, 8s)
- **AND** maximum delay is capped

---

### Requirement: Task Concurrency
The system SHALL support configurable task concurrency.

#### Scenario: Concurrent task limit
- **WHEN** multiple tasks are queued
- **THEN** maximum N tasks run concurrently
- **AND** additional tasks wait in queue

#### Scenario: Task-specific concurrency
- **WHEN** different task types have different concurrency needs
- **THEN** each task type can have its own concurrency setting
