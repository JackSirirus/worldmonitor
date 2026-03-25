# Docker Compose Specification

## ADDED Requirements

### Requirement: Single Container Deployment

The docker-compose.yml SHALL define a single service that runs the complete application.

#### Scenario: Default Deployment
- **WHEN** user runs `docker-compose up`
- **THEN** container starts and serves application on port 3000

### Requirement: Environment Variable Configuration

The docker-compose.yml SHALL support environment variable loading from .env file.

#### Scenario: Production Deployment
- **WHEN** .env file is present with all required variables
- **THEN** container uses those variables for configuration

### Requirement: Port Configuration

The docker-compose.yml SHALL expose port 3000 for HTTP access.

#### Scenario: Custom Port
- **WHEN** PORTS environment is not set
- **THEN** default port 3000 is exposed

### Requirement: Health Check

The container SHALL include a health check endpoint.

#### Scenario: Health Check
- **WHEN** Docker executes health check
- **THEN** it SHALL check http://localhost:3001/api/health

### Requirement: Automatic Restart

The container SHALL restart automatically unless explicitly stopped.

#### Scenario: Container Crash
- **WHEN** container exits with non-zero code
- **THEN** Docker restarts the container automatically
