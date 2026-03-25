# Specification: local-dev-links

## ADDED Requirements

### Requirement: Variant buttons link to local server in development

The variant switching buttons (WORLD/TECH) in the application header SHALL link to the local development server when running in a local environment, instead of navigating to external production domains.

#### Scenario: User clicks TECH button on local full variant
- **WHEN** user is on local development server (localhost) running full variant
- **AND** user clicks the TECH button
- **THEN** browser navigates to `http://localhost:3000/?variant=tech` instead of `https://tech.worldmonitor.app`

#### Scenario: User clicks WORLD button on local tech variant
- **WHEN** user is on local development server (localhost) running tech variant
- **AND** user clicks the WORLD button
- **THEN** browser navigates to `http://localhost:3000/?variant=full` instead of `https://worldmonitor.app`

#### Scenario: User clicks button on production environment
- **WHEN** user is on production environment (worldmonitor.app or tech.worldmonitor.app)
- **AND** user clicks a variant button
- **THEN** browser navigates to the external production domain (unchanged behavior)

### Requirement: URL parameter overrides variant

The application SHALL check for a `variant` URL parameter on startup and use its value to determine the active variant, overriding the compiled default.

#### Scenario: App starts with variant parameter
- **WHEN** application initializes with URL containing `?variant=tech`
- **THEN** application loads using tech variant configuration
- **AND** URL parameter takes precedence over compiled SITE_VARIANT

#### Scenario: App starts without variant parameter
- **WHEN** application initializes with no `variant` URL parameter
- **THEN** application uses the compiled SITE_VARIANT value
- **AND** behaves as before (unchanged)
