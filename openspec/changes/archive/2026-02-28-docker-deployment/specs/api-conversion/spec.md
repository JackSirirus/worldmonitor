# API Conversion Specification

## ADDED Requirements

### Requirement: Endpoint Path Compatibility

All converted Express routes SHALL use the same URL paths as the original Vercel Edge Functions.

#### Scenario: Client Calls /api/coingecko
- **WHEN** client sends request to /api/coingecko
- **THEN** Express route handles the request and returns same response format

### Requirement: Query Parameter Compatibility

Express routes SHALL handle query parameters identically to Edge Functions.

#### Scenario: Client Calls with Parameters
- **WHEN** client sends /api/stock-index?code=AAPL
- **THEN** server extracts code=AAPL and returns relevant data

### Requirement: Response Format Compatibility

Converted endpoints SHALL return responses in the same JSON format.

#### Scenario: API Returns JSON
- **WHEN** /api/earthquakes is called
- **THEN** response contains same fields as original Edge Function

### Requirement: Dynamic Route Support

Express routes SHALL handle Vercel's dynamic route patterns.

#### Scenario: EIA Dynamic Route
- **WHEN** client calls /api/eia/series/petrpor.us.a
- **THEN** Express route /api/eia/* handles the request

#### Scenario: Wingbits Dynamic Route
- **WHEN** client calls /api/wingbits/Aircraft1
- **THEN** Express route /api/wingbits/* handles the request

### Requirement: POST Request Support

API endpoints that accept POST requests SHALL handle JSON body parsing.

#### Scenario: AI Summary POST
- **WHEN** client sends POST /api/groq-summarize with JSON body
- **THEN** server parses headlines array and returns summary
