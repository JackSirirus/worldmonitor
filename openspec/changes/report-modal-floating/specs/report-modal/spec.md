## ADDED Requirements

### Requirement: Report Modal Display

The system SHALL display report details in a floating modal centered on the page when the user clicks a report item in the report list.

#### Scenario: Open report modal
- **WHEN** user clicks on a report item in the report list
- **THEN** system SHALL fetch the report details from `/api/reports/:id`
- **AND** system SHALL display a modal overlay covering the entire viewport
- **AND** system SHALL display the report title and content in the modal

#### Scenario: Modal displays correctly on different screen sizes
- **WHEN** modal is displayed
- **THEN** modal SHALL have a maximum width of 800px
- **AND** modal SHALL have a maximum height of 80vh
- **AND** modal SHALL be horizontally and vertically centered using flexbox

#### Scenario: Report content is rendered as Markdown
- **WHEN** modal displays report content
- **THEN** content SHALL be rendered preserving line breaks and basic formatting

### Requirement: Modal Close Behavior

The system SHALL allow the user to close the modal through multiple methods.

#### Scenario: Close via close button
- **WHEN** user clicks the close button (×) in modal header
- **THEN** system SHALL hide the modal overlay

#### Scenario: Close via ESC key
- **WHEN** user presses the ESC key while modal is open
- **THEN** system SHALL hide the modal overlay

#### Scenario: Close via backdrop click
- **WHEN** user clicks on the modal overlay (outside the modal content)
- **THEN** system SHALL hide the modal overlay

### Requirement: Modal State Management

The modal SHALL manage its visibility state properly.

#### Scenario: Single modal instance
- **WHEN** user attempts to open a modal while another is already open
- **THEN** system SHALL replace the existing modal content with the new report

#### Scenario: Modal does not scroll the body
- **WHEN** modal is open
- **THEN** body scroll SHALL be disabled to prevent background scrolling

### Requirement: Report Panel Integration

The ReportPanel component SHALL use the modal for displaying report details instead of inline rendering.

#### Scenario: ReportPanel triggers modal
- **WHEN** user clicks on a report item
- **THEN** ReportPanel SHALL invoke ReportModal.show() with the report data
- **AND** ReportPanel SHALL NOT render report details inline in the sidebar

#### Scenario: ReportPanel subscribes to modal close
- **WHEN** modal is closed through any method
- **THEN** ReportPanel SHALL clear the current report selection
