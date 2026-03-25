# Docker Server Specification

## ADDED Requirements

### Requirement: Express Server Serves API and Frontend

The Docker container SHALL run an Express.js server that serves both the API endpoints and the built frontend static files.

#### Scenario: Production Mode
- **WHEN** Docker container starts with NODE_ENV=production
- **THEN** Express server listens on port 3001 and serves static files from /app/dist

#### Scenario: Development Mode
- **WHEN** Docker container starts with NODE_ENV=development
- **THEN** Express server enables hot reload and serves API on port 3001

### Requirement: All 45+ API Endpoints Functional

The Express server SHALL implement all existing Vercel Edge Function endpoints without breaking existing API contracts.

#### Scenario: GET Request to Simple Endpoint
- **WHEN** client sends GET /api/coingecko?ids=bitcoin
- **THEN** server returns JSON with cryptocurrency data

#### Scenario: POST Request to AI Endpoint
- **WHEN** client sends POST /api/groq-summarize with headlines array
- **THEN** server returns AI-generated summary

### Requirement: CORS Configuration via Environment Variable

The server SHALL read allowed origins from CORS_ORIGINS environment variable.

#### Scenario: Custom Domain Request
- **WHEN** CORS_ORIGINS=example.com and client sends request from https://example.com
- **THEN** server includes Access-Control-Allow-Origin: https://example.com in response

#### Scenario: Unauthorized Origin
- **WHEN** CORS_ORIGINS=example.com and client sends request from https://evil.com
- **THEN** server returns 403 Forbidden

### Requirement: Redis Cache Integration

The server SHALL connect to Upstash Redis using environment variables UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.

#### Scenario: Redis Available
- **WHEN** Redis environment variables are set
- **THEN** server uses Redis for caching API responses

#### Scenario: Redis Unavailable
- **WHEN** Redis environment variables are not set
- **THEN** server operates without cache, using in-memory fallback

### Requirement: Graceful Shutdown

The server SHALL handle SIGTERM and SIGINT signals for graceful container shutdown.

#### Scenario: Container Receives SIGTERM
- **WHEN** Docker sends SIGTERM to container
- **THEN** server stops accepting new connections, completes existing requests, then exits
