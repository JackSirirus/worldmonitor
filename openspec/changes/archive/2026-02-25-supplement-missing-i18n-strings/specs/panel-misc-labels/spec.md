# Panel Miscellaneous Labels i18n Specification

## ADDED Requirements

### Requirement: Regulation panel tab labels shall be translatable
Tab labels in AI Regulation Dashboard panel SHALL use translation keys.

#### Scenario: Regulation panel tabs
- **WHEN** user views RegulationPanel
- **THEN** tabs "Timeline", "Deadlines", "Regulations", "Countries" SHALL use translation keys from `regulation.tabs.*`

### Requirement: Verification checklist labels shall be translatable
All verification checklist item labels SHALL use translation keys.

#### Scenario: Verification checklist display
- **WHEN** user views verification checklist
- **THEN** all item labels SHALL use translation keys from `verification.*` namespace

### Requirement: Intelligence gap badge text shall be translatable
Intelligence badge descriptions and tooltips SHALL use translation keys.

#### Scenario: Intelligence findings badge
- **WHEN** intelligence findings badge displays tooltip
- **THEN** text SHALL use translation key `intel.intelligenceFindings`

### Requirement: Panel description text shall be translatable
Description text in panels (GeoHubs, TechHubs, Cascade) SHALL use translation keys.

#### Scenario: GeoHubs panel description
- **WHEN** user views GeoHubsPanel
- **THEN** description text SHALL use translation key `geoHubs.description`

### Requirement: Country intelligence modal labels shall be translatable
Prediction Markets label in CountryIntelModal SHALL use translation key.

#### Scenario: Prediction markets label
- **WHEN** CountryIntelModal displays prediction markets section
- **THEN** label SHALL use translation key `countryIntel.predictionMarkets`

### Requirement: Tech events panel auxiliary labels shall be translatable
"Show on map" button in TechEventsPanel SHALL use translation key.

#### Scenario: Show on map button
- **WHEN** user views TechEventsPanel
- **THEN** map button title SHALL use translation key `techEvents.showOnMap`
