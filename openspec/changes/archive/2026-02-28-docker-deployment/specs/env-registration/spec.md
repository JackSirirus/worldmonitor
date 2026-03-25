# Environment Variable Registration Specification

## ADDED Requirements

### Requirement: Complete Environment Variable Documentation

The project SHALL provide documentation for all required and optional environment variables.

#### Scenario: User Reads Documentation
- **WHEN** user opens .env.example or README.md
- **THEN** they can see all variables with descriptions and registration links

### Requirement: Registration Links for External Services

Each external API variable SHALL include a registration link to the service provider.

#### Scenario: User Needs Groq API Key
- **WHEN** user reads documentation for GROQ_API_KEY
- **THEN** they can find link to https://console.groq.com/

### Requirement: Tiered Configuration Guide

The documentation SHALL provide tiered configuration options (minimal, recommended, full).

#### Scenario: User Wants Minimal Setup
- **WHEN** user only wants to run the application
- **THEN** they can configure just VITE_VARIANT and it will work

#### Scenario: User Wants Full Functionality
- **WHEN** user wants all 45+ APIs working
- **THEN** they can configure all variables listed in the documentation

### Requirement: Verification Steps

The documentation SHALL include steps to verify each API is working correctly.

#### Scenario: User Configures Finnhub
- **WHEN** user adds FINNHUB_API_KEY
- **THEN** they can verify it works by checking the Markets panel
