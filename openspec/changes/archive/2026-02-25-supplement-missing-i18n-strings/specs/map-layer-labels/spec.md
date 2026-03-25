# Map Layer Labels i18n Specification

## ADDED Requirements

### Requirement: Map layer toggle labels shall be translatable
All layer toggle labels displayed in the map control panel SHALL use translation keys and be available in all supported locales (en, zh-CN, zh-TW).

#### Scenario: Tech variant layer labels
- **WHEN** user views map layer toggles with SITE_VARIANT=tech
- **THEN** labels including "Startup Hubs", "Tech HQs", "Accelerators", "Cloud Regions", "Tech Events" SHALL display in the selected language

#### Scenario: Full variant layer labels
- **WHEN** user views map layer toggles with SITE_VARIANT=full
- **THEN** labels including "Undersea Cables", "Military Bases", "Strategic Waterways", "Critical Minerals" SHALL display in the selected language

### Requirement: Map legend items shall be translatable
All legend items displayed on the map SHALL use translation keys.

#### Scenario: Legend item display
- **WHEN** map displays legend for any layer
- **THEN** all legend labels SHALL use translation keys and display in the selected language

### Requirement: Map tooltip content shall be translatable
Static text within map tooltips (non-data portions) SHALL use translation keys.

#### Scenario: Military aircraft tooltip
- **WHEN** user hovers over military aircraft
- **THEN** the static text "Military Aircraft" in tooltip SHALL use translation key `map.tooltip.militaryAircraft`

#### Scenario: Vessel cluster tooltip
- **WHEN** user hovers over vessel cluster
- **THEN** the static text "Vessel Cluster" in tooltip SHALL use translation key `map.tooltip.vesselCluster`

#### Scenario: Internet outage tooltip
- **WHEN** user hovers over internet outage marker
- **THEN** the static text "Internet Outage" in tooltip SHALL use translation key `map.tooltip.internetOutage`

### Requirement: Map activity status labels shall be translatable
Activity status labels (BREAKING NEWS, High activity, etc.) SHALL use translation keys.

#### Scenario: Activity status display
- **WHEN** map displays activity status for hotspots
- **THEN** status labels SHALL use translation keys from `map.activity.*` namespace

### Requirement: LAST UPDATE timestamp label shall be translatable
The "LAST UPDATE" prefix in the timestamp display SHALL use translation key.

#### Scenario: Timestamp label
- **WHEN** map displays last update timestamp
- **THEN** the "LAST UPDATE" label SHALL use translation key `map.lastUpdate`
