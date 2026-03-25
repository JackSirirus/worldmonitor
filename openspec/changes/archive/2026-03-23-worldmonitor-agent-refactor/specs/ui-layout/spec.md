# UI Layout Specification

## ADDED Requirements

### Requirement: News Panel (Left)
The system SHALL display news panel on the left side.

#### Scenario: Display news list
- **WHEN** the page loads
- **THEN** news panel is displayed on the left
- **AND** shows list of recent news items

#### Scenario: News item display
- **WHEN** news items are rendered
- **THEN** each item shows title, source, time
- **AND** supports Chinese/English toggle

#### Scenario: News filtering
- **WHEN** user applies filter
- **THEN** news list updates to show filtered results
- **AND** supports category, source, language filters

---

### Requirement: Chat Window (Center)
The system SHALL display chat window in the center for AI interaction.

#### Scenario: Display chat interface
- **WHEN** the page loads
- **THEN** chat window is displayed in the center
- **AND** provides text input for queries

#### Scenario: Send message
- **WHEN** user submits a message
- **THEN** message is sent to AI agent
- **AND** response is displayed in the chat

#### Scenario: Display AI response
- **WHEN** AI generates a response
- **THEN** the response is displayed in the chat
- **AND** supports markdown formatting

---

### Requirement: Report Panel (Top Right)
The system SHALL display report panel in the top right area.

#### Scenario: Display report list
- **WHEN** the page loads
- **THEN** report panel is displayed in top right
- **AND** shows list of generated reports

#### Scenario: View report
- **WHEN** user clicks on a report
- **THEN** report content is displayed
- **AND** supports export functionality

---

### Requirement: Map Display (Below Header)
The system SHALL display the map below the header area.

#### Scenario: Display map
- **WHEN** the page loads
- **THEN** map is displayed below the header
- **AND** shows relevant geographical data

#### Scenario: Map interaction
- **WHEN** user interacts with the map
- **THEN** map responds to zoom, pan, click
- **AND** displays markers for relevant locations

---

### Requirement: Agent Control Panel
The system SHALL provide an agent control panel for task management.

#### Scenario: Display agent panel
- **WHEN** user opens agent panel
- **THEN** panel shows current agent status
- **AND** displays running tasks

#### Scenario: Trigger manual task
- **WHEN** user clicks "Run Now" button
- **THEN** a task is triggered via API
- **AND** progress is shown in real-time

#### Scenario: View task logs
- **WHEN** user selects a running task
- **THEN** logs are streamed in real-time
- **AND** displayed in the panel

---

### Requirement: Zustand State Management
The system SHALL use Zustand for state management.

#### Scenario: Global state access
- **WHEN** any component needs to access global state
- **THEN** Zustand store provides the data
- **AND** components subscribe to relevant state only

#### Scenario: State updates
- **WHEN** state changes in store
- **THEN** subscribed components automatically update
- **AND** no unnecessary re-renders occur

---

### Requirement: WebSocket Integration
The system SHALL integrate WebSocket for real-time updates.

#### Scenario: Connect on load
- **WHEN** the page loads
- **THEN** WebSocket connection is established
- **AND** maintains connection throughout session

#### Scenario: Handle incoming messages
- **WHEN** WebSocket message is received
- **THEN** appropriate state is updated
- **AND** UI reflects the changes immediately
