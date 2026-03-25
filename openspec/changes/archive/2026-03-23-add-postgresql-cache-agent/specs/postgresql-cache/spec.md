# Specification: PostgreSQL Cache

## ADDED Requirements

### Requirement: Database connection configuration
The system SHALL support PostgreSQL database connection via environment variable `DATABASE_URL`.

#### Scenario: Development environment connection
- **WHEN** `DATABASE_URL` is set to `postgres://user:pass@localhost:5432/worldmonitor`
- **THEN** system SHALL connect to local PostgreSQL instance

#### Scenario: Production environment connection
- **WHEN** `DATABASE_URL` is set to `postgres://user:pass@postgres:5432/worldmonitor`
- **THEN** system SHALL connect to PostgreSQL in Docker network

### Requirement: Database schema initialization
The system SHALL automatically create required tables on startup if they do not exist.

#### Scenario: First startup
- **WHEN** system starts with empty database
- **THEN** system SHALL create tables: `rss_sources`, `rss_items`, `agent_tasks`, `reports`, `podcasts`

#### Scenario: Subsequent startup
- **WHEN** system starts with existing tables
- **THEN** system SHALL NOT modify existing schema

### Requirement: Database connection pooling
The system SHALL use connection pooling to manage database connections efficiently.

#### Scenario: Multiple concurrent requests
- **WHEN** 10 simultaneous requests access the database
- **THEN** system SHALL reuse connections from the pool

### Requirement: Database health check
The system SHALL provide a health check endpoint that verifies database connectivity.

#### Scenario: Database is healthy
- **WHEN** health check is called
- **AND** database is reachable
- **THEN** endpoint SHALL return status `healthy`

#### Scenario: Database is unreachable
- **WHEN** health check is called
- **AND** database is not reachable
- **THEN** endpoint SHALL return status `unhealthy` with error message
