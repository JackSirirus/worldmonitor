# Logging Specification

## ADDED Requirements

### Requirement: Structured Logging
The system SHALL use structured logging with Pino.

#### Scenario: Log entry format
- **WHEN** a log is written
- **THEN** it's stored as JSON
- **AND** includes: timestamp, level, message, context

#### Scenario: Log levels
- **WHEN** logging at different levels
- **THEN** supported levels are: debug, info, warn, error
- **AND** each has numeric value for filtering

---

### Requirement: Log Output
The system SHALL support multiple log output destinations.

#### Scenario: Console output
- **WHEN** application runs in development
- **THEN** logs are output to console
- **AND** formatted for readability

#### Scenario: File output
- **WHEN** application runs in production
- **THEN** logs are written to files
- **AND** stored in /var/log/worldmonitor/

---

### Requirement: Context Logging
The system SHALL include context in log entries.

#### Scenario: Service context
- **WHEN** logging from a service
- **THEN** the service name is included in context

#### Scenario: Task context
- **WHEN** logging during task execution
- **THEN** task ID is included in context
- **AND** allows correlation of logs

---

### Requirement: Log Retention
The system SHALL retain logs according to retention policies.

#### Scenario: Application log retention
- **WHEN** cleanup runs
- **THEN** application logs older than 7 days are deleted

#### Scenario: Task log retention
- **WHEN** cleanup runs
- **THEN** task logs older than 30 days are deleted

#### Scenario: Error log retention
- **WHEN** cleanup runs
- **THEN** error logs older than 90 days are deleted

---

### Requirement: Log Collection
The system SHALL support centralized log collection.

#### Scenario: Stream logs to stdout
- **WHEN** running in Docker
- **THEN** logs are written to stdout
- **AND** can be collected by Docker logging driver

#### Scenario: Structured JSON logs
- **WHEN** logs are written
- **THEN** they're in JSON format
- **AND** can be parsed by log aggregation tools

---

### Requirement: Performance
The system SHALL minimize logging performance impact.

#### Scenario: Async logging
- **WHEN** application logs a message
- **THEN** logging is asynchronous
- **AND** doesn't block the main thread

#### Scenario: Log level filtering
- **WHEN** debug logging is disabled
- **THEN** debug messages are not processed
- **AND** improves performance
