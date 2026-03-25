## ADDED Requirements

### Requirement: Auto-backend-detection SHALL detect local backend availability

The Vite development server SHALL automatically detect if the local Express backend is running on port 3001 (or configured PORT) at startup.

#### Scenario: Backend is running
- **WHEN** Vite starts and local backend is running on port 3001
- **THEN** the `/api/health` endpoint responds with HTTP 200 and JSON containing `{"status": "ok"}`
- **AND** Vite configures proxy to route `/api/*` requests to `http://localhost:3001`

#### Scenario: Backend is not running
- **WHEN** Vite starts and local backend is NOT running on port 3001
- **THEN** the health check times out or returns non-200 response
- **AND** Vite falls back to external API proxy configuration

#### Scenario: Backend starts after Vite
- **WHEN** Vite has already started without detecting backend
- **THEN** user must restart Vite to re-trigger detection
- **AND** detection only happens once at Vite startup

### Requirement: Proxy configuration SHALL be logged at startup

The Vite server SHALL display clear logging indicating which proxy mode is active.

#### Scenario: Local backend detected
- **WHEN** local backend is running and detected
- **THEN** startup logs SHALL display:
  ```
  📡 Vite Proxy Configuration:
     Local Backend Running: YES
     ➜ Using local backend: http://localhost:3001
  ```

#### Scenario: External proxies used
- **WHEN** local backend is NOT running or detection fails
- **THEN** startup logs SHALL display:
  ```
  📡 Vite Proxy Configuration:
     Local Backend Running: NO
     ➜ Using external API proxies (default)
  ```

### Requirement: Manual override SHALL take precedence

Users SHALL be able to manually force a specific proxy mode via environment variable.

#### Scenario: Manual override enabled
- **WHEN** `VITE_USE_LOCAL_BACKEND=true` is set in environment
- **AND** local backend is running
- **THEN** Vite SHALL use local backend regardless of detection result
- **AND** startup log SHALL note the manual override

#### Scenario: Manual override disabled
- **WHEN** `VITE_USE_LOCAL_BACKEND=false` is set in environment
- **THEN** Vite SHALL use external proxies regardless of backend availability
- **AND** startup log SHALL note the manual override

#### Scenario: Manual override enabled but backend not running
- **WHEN** `VITE_USE_LOCAL_BACKEND=true` is set in environment
- **AND** local backend is NOT running or cannot be reached
- **THEN** Vite SHALL attempt to connect to local backend
- **AND** Vite SHALL log a warning that backend is not available
- **AND** Vite SHALL fall back to external proxies

### Requirement: Timeout SHALL prevent hanging

The backend detection SHALL have a reasonable timeout to prevent long waits.

#### Scenario: Detection timeout
- **WHEN** backend is unresponsive and exceeds 2 second timeout
- **THEN** Vite SHALL treat this as "backend not available"
- **AND** Vite SHALL proceed with external proxy configuration

### Requirement: Health endpoint path SHALL be configurable

The health check endpoint path SHALL be derived from backend configuration.

#### Scenario: Default health check
- **WHEN** backend runs on default port 3001
- **THEN** Vite SHALL check `http://localhost:3001/api/health`

#### Scenario: Custom port
- **WHEN** backend runs on custom port via `PORT` environment variable
- **THEN** Vite SHALL check `http://localhost:{PORT}/api/health`

### Requirement: Proxy routing SHALL route all /api/* requests to backend

When local backend is detected, all `/api/*` requests SHALL be routed to the local backend server.

#### Scenario: All API routes go to backend
- **WHEN** local backend is running and detected
- **AND** frontend makes request to `/api/some-endpoint`
- **THEN** Vite SHALL proxy request to `http://localhost:3001/api/some-endpoint`
- **AND** backend handles routing to external APIs internally

#### Scenario: Backend doesn't implement route
- **WHEN** local backend is running and detected
- **AND** frontend makes request to `/api/unknown-route` (not implemented in backend)
- **THEN** backend SHALL return HTTP 404
- **AND** frontend receives 404 error

#### Scenario: External proxies when backend off
- **WHEN** local backend is NOT running
- **AND** frontend makes request to `/api/yahoo/quote`
- **THEN** Vite SHALL use external API proxy (e.g., to Yahoo Finance)
- **AND** frontend receives data from external API
