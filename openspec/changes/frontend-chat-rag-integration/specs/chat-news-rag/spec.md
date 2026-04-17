# chat-news-rag

## ADDED Requirements

### Requirement: News retrieval on chat

The system SHALL retrieve relevant news from the database when a user sends a chat message, to provide context for AI-generated responses.

#### Scenario: Retrieve news by keyword search
- **WHEN** user sends message "最新AI新闻有哪些"
- **THEN** system SHALL search news with keywords extracted from user message
- **AND** system SHALL retrieve up to 10 news items from the past 7 days

#### Scenario: Empty results handling
- **WHEN** user sends message and no news matches the search
- **THEN** system SHALL still call AI API with empty news context
- **AND** AI SHALL respond based on its training knowledge

---

### Requirement: News context injection

The system SHALL inject retrieved news as context into the AI prompt to enable informed responses.

#### Scenario: System prompt includes news titles
- **WHEN** news items are retrieved
- **THEN** system SHALL construct a system prompt containing the news titles
- **AND** each news item SHALL include title, source, and pub_date
- **AND** news items SHALL be formatted as a numbered list

#### Scenario: System prompt without news
- **WHEN** no news items are retrieved
- **THEN** system SHALL construct a system prompt indicating no relevant news found
- **AND** AI SHALL be informed to answer based on general knowledge

---

### Requirement: Response format

The system SHALL return AI responses along with metadata about retrieved news.

#### Scenario: Successful response with news context
- **WHEN** AI generates a response with news context
- **THEN** response SHALL include the AI's answer in `response` field
- **AND** response SHALL include the retrieved news items in `news` field

#### Scenario: Response without news context
- **WHEN** AI generates a response without news context
- **THEN** response SHALL still include the AI's answer in `response` field
- **AND** `news` field SHALL be an empty array
