# Language Preference Specification

## ADDED Requirements

### Requirement: Language switcher UI visibility
The system SHALL provide a language switcher component in the page header.

#### Scenario: Language switcher is present
- **WHEN** page loads completely
- **THEN** a language switcher button is visible in the header
- **AND** button shows current language name with emoji flag

#### Scenario: Language switcher dropdown interaction
- **WHEN** user clicks the language switcher button
- **THEN** a dropdown menu appears with all available languages
- **AND** each option shows language flag emoji and name
- **AND** current language is visually indicated

#### Scenario: Dropdown closes on outside click
- **WHEN** language dropdown is open and user clicks elsewhere
- **THEN** dropdown menu closes immediately

### Requirement: Language selection action
The system SHALL allow users to select a different language from the switcher.

#### Scenario: User selects different language
- **WHEN** user clicks "简体中文" in the dropdown while English is active
- **THEN** system switches to Chinese locale
- **AND** all UI text updates to Chinese immediately
- **AND** dropdown closes
- **AND** preference is saved to localStorage

#### Scenario: User selects same language
- **WHEN** user clicks currently active language in dropdown
- **THEN** system makes no changes
- **AND** dropdown closes
- **AND** no re-rendering occurs

### Requirement: Language event notification
The system SHALL dispatch a 'languagechanged' custom event when language changes.

#### Scenario: Event dispatched on language change
- **WHEN** user selects a new language
- **THEN** 'languagechanged' event is dispatched on document
- **AND** event contains new locale in detail

#### Scenario: Components listen for language changes
- **WHEN** a component is listening for 'languagechanged' event
- **AND** user changes language
- **THEN** component receives the event
- **AND** component can re-render its content
