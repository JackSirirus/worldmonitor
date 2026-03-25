# Specification: AI Providers

## ADDED Requirements

### Requirement: Multi-provider support
The system SHALL support multiple AI providers with configurable priority.

#### Scenario: Primary provider available
- **WHEN** MiniMax API key is configured
- **AND** request is made
- **THEN** system SHALL use MiniMax as primary provider

#### Scenario: Primary provider fails
- **WHEN** MiniMax request fails
- **THEN** system SHALL automatically fallback to next available provider (Groq, OpenRouter)

#### Scenario: No providers available
- **WHEN** all configured providers fail
- **THEN** system SHALL return error with available provider list

### Requirement: Provider configuration
The system SHALL read provider configurations from environment variables.

#### Scenario: MiniMax configuration
- **WHEN** `MINIMAX_API_KEY` is set
- **THEN** system SHALL use MiniMax endpoint with that key

#### Scenario: Groq configuration
- **WHEN** `GROQ_API_KEY` is set
- **THEN** system SHALL use Groq as fallback provider

#### Scenario: OpenRouter configuration
- **WHEN** `OPENROUTER_API_KEY` is set
- **THEN** system SHALL use OpenRouter as additional fallback

#### Scenario: Lepton configuration
- **WHEN** `LEPTON_API_KEY` is set
- **AND** other providers fail
- **THEN** system SHALL use Lepton as last resort

### Requirement: OpenAI compatible API format
All providers SHALL use OpenAI-compatible API format.

#### Scenario: Chat completion request
- **WHEN** request is made to `/api/ai/chat`
- **THEN** system SHALL format request according to OpenAI chat completion spec

#### Scenario: Response format
- **WHEN** AI provider returns response
- **THEN** system SHALL return in OpenAI format regardless of provider

### Requirement: Provider health monitoring
The system SHALL monitor provider availability and track success rates.

#### Scenario: Track provider failures
- **WHEN** provider request fails
- **THEN** system SHALL increment failure counter

#### Scenario: Provider recovery
- **WHEN** provider succeeds after failure
- **THEN** system SHALL reset failure counter
