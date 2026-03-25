# Bilingual SEO Specification

## ADDED Requirements

### Requirement: HTML lang attribute
The system SHALL update the HTML lang attribute when language changes.

#### Scenario: English language
- **WHEN** current locale is 'en'
- **THEN** `<html>` element has `lang="en"` attribute

#### Scenario: Simplified Chinese language
- **WHEN** current locale is 'zh-cn'
- **THEN** `<html>` element has `lang="zh-CN"` attribute

#### Scenario: Traditional Chinese language
- **WHEN** current locale is 'zh-tw'
- **THEN** `<html>` element has `lang="zh-TW"` attribute

### Requirement: hreflang alternate links
The system SHALL provide hreflang tags indicating language alternates to search engines.

#### Scenario: hreflang tags present
- **WHEN** page loads with any locale
- **THEN** document head contains `<link rel="alternate" hreflang="en">` tag
- **AND** document head contains `<link rel="alternate" hreflang="zh-CN">` tag
- **AND** document head contains `<link rel="alternate" hreflang="zh-TW">` tag

#### Scenario: hreflang tags point to same URL
- **WHEN** using single-URL deployment strategy
- **THEN** all hreflang tags point to same base URL 'https://worldmonitor.app/'
- **AND** search engines understand all language versions exist at same URL

#### Scenario: x-default hreflang for unmatched languages
- **WHEN** user's browser language is not in supported list (e.g., fr-FR)
- **THEN** hreflang tag with `hreflang="x-default"` is present
- **AND** x-default points to English version
- **AND** search engines serve English as default for unmatched languages

#### Scenario: hreflang tags include all three languages
- **WHEN** page loads with any locale
- **THEN** hreflang for 'en' is present
- **AND** hreflang for 'zh-CN' is present
- **AND** hreflang for 'zh-TW' is present
- **AND** hreflang for 'x-default' is present

### Requirement: Canonical URL
The system SHALL specify canonical URL for search engines.

#### Scenario: Canonical link present
- **WHEN** page loads
- **THEN** document head contains `<link rel="canonical">` tag
- **AND** canonical URL points to 'https://worldmonitor.app/'

### Requirement: Sitemap generation
The system SHALL provide a sitemap.xml file listing all page variants.

#### Scenario: Sitemap includes all language alternates
- **WHEN** sitemap.xml is requested
- **THEN** file contains entry for main URL
- **AND** entry includes xhtml:link elements for zh-CN and zh-TW
- **AND** each xhtml:link specifies hreflang and href attributes

#### Scenario: Sitemap format compliance
- **WHEN** sitemap.xml is parsed
- **THEN** file follows standard sitemap 0.9 schema
- **AND** includes proper XML namespaces for xhtml:link
