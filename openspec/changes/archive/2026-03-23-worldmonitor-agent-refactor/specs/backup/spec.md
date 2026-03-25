# Backup Specification

## ADDED Requirements

### Requirement: Automatic Database Backup
The system SHALL perform automatic database backups.

#### Scenario: Daily backup schedule
- **WHEN** time is 3 AM
- **THEN** database backup task runs automatically
- **AND** creates a full backup

#### Scenario: Backup creation
- **WHEN** backup runs
- **THEN** pg_dump creates SQL dump
- **AND** output is compressed with gzip

---

### Requirement: Cloud Storage Upload
The system SHALL upload backups to cloud storage.

#### Scenario: Upload to cloud
- **WHEN** backup is created
- **THEN** compressed backup is uploaded to cloud storage
- **AND** uses AWS S3 or compatible storage

#### Scenario: Backup naming
- **WHEN** backup file is created
- **THEN** naming format is: worldmonitor_YYYYMMDD_HHMMSS.dump.gz
- **AND** includes timestamp

---

### Requirement: Backup Retention
The system SHALL retain backups for 7 days.

#### Scenario: Cleanup old backups
- **WHEN** cleanup runs
- **THEN** backups older than 7 days are deleted
- **AND** storage space is reclaimed

#### Scenario: Keep minimum backups
- **WHEN** cleanup deletes old backups
- **THEN** at least 7 backups are always retained

---

### Requirement: Backup Verification
The system SHALL verify backup integrity.

#### Scenario: Test backup restoration
- **WHEN** backup is created
- **THEN** verification is performed
- **AND** errors are logged if backup is corrupt

---

### Requirement: Backup Monitoring
The system SHALL monitor backup operations.

#### Scenario: Log backup results
- **WHEN** backup completes
- **THEN** success/failure is logged
- **AND** includes backup size and duration

#### Scenario: Alert on failure
- **WHEN** backup fails
- **THEN** alert is triggered
- **AND** administrator is notified

---

### Requirement: Backup Restoration
The system SHALL support restoring from backup.

#### Scenario: Restore from file
- **WHEN** restore is requested
- **THEN** backup file is decompressed
- **AND** data is restored to database

#### Scenario: Point-in-time recovery
- **WHEN** specific point-in-time is requested
- **THEN** appropriate backup is selected
- **AND** data is restored to that time
