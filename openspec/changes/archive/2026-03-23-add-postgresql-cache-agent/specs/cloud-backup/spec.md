# Specification: Cloud Backup

## ADDED Requirements

### Requirement: Automatic database backup
The system SHALL perform automatic daily backups of the PostgreSQL database.

#### Scenario: Daily backup execution
- **WHEN** scheduled time is reached (default: 3:00 UTC)
- **THEN** system SHALL execute pg_dump
- **AND** save to local backup directory

#### Scenario: Backup file naming
- **WHEN** backup is created
- **THEN** filename SHALL include date: `worldmonitor_YYYY-MM-DD.sql`

### Requirement: Local backup retention
The system SHALL retain local backups for 30 days.

#### Scenario: Cleanup old local backups
- **WHEN** backup completes
- **AND** local backups older than 30 days exist
- **THEN** system SHALL delete old backups

### Requirement: Cloud upload
The system SHALL upload backups to cloud storage.

#### Scenario: Cloudflare R2 upload
- **WHEN** `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` are configured
- **AND** backup is created
- **THEN** system SHALL upload to R2

#### Scenario: AWS S3 upload
- **WHEN** `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `S3_BUCKET` are configured
- **AND** backup is created
- **THEN** system SHALL upload to S3

### Requirement: Cloud backup retention
The system SHALL retain cloud backups for 1 year.

#### Scenario: Cleanup old cloud backups
- **WHEN** cloud upload completes
- **AND** cloud backups older than 1 year exist
- **THEN** system SHALL delete old cloud backups

### Requirement: Backup verification
The system SHALL verify backup integrity.

#### Scenario: Verify backup file
- **WHEN** backup is created
- **THEN** system SHALL verify file size > 0
- **AND** log backup size

### Requirement: Backup failure handling
The system SHALL handle backup failures gracefully.

#### Scenario: Local backup fails
- **WHEN** pg_dump fails
- **THEN** system SHALL log error
- **AND** send notification if configured
- **AND** NOT proceed with upload

#### Scenario: Cloud upload fails
- **WHEN** upload to cloud fails
- **THEN** system SHALL retry up to 3 times
- **AND** keep local backup for manual upload
