# TTS Agent

## ADDED Requirements

### Requirement: TTS triggered after report generation
The TTS agent SHALL automatically convert report to audio after generation.

#### Scenario: Report generated
- **WHEN** report is successfully generated
- **AND** TTS is enabled in configuration
- **THEN** TTS agent converts report content to audio

### Requirement: Voice selection based on language
The TTS agent SHALL select appropriate voice based on report language.

#### Scenario: English report
- **WHEN** report content is primarily English
- **THEN** voice 'en-US-AriaNeural' is used

#### Scenario: Chinese report
- **WHEN** report content is primarily Chinese (Simplified)
- **THEN** voice 'zh-CN-XiaoxiaoNeural' is used

#### Scenario: Traditional Chinese report
- **WHEN** report content is Traditional Chinese
- **THEN** voice 'zh-TW-HsiaoChenNeural' is used

### Requirement: Audio is saved to storage
Generated audio SHALL be saved to configured storage location.

#### Scenario: Audio saved
- **WHEN** TTS conversion completes
- **AND** audio file is generated
- **THEN** file is saved to PODCAST_DIR
- **AND** metadata is stored in podcasts table

### Requirement: Podcast metadata is stored
The system SHALL store podcast metadata in database.

#### Scenario: Podcast saved
- **WHEN** audio file is saved
- **AND** podcast metadata is created
- **THEN** podcasts table contains:
  - title: matching report title
  - audio_url: path to audio file
  - duration: estimated duration in seconds
  - language: detected language
  - report_id: reference to source report

### Requirement: Content chunking for long reports
Long reports SHALL be chunked before TTS conversion.

#### Scenario: Content too long
- **WHEN** report content exceeds 2500 characters
- **THEN** content is split into chunks
- **AND** each chunk is converted separately
- **AND** chunks are concatenated

### Requirement: TTS is skippable
TTS generation SHALL be skippable via configuration.

#### Scenario: TTS disabled
- **WHEN** TTS is disabled in configuration
- **AND** report is generated
- **THEN** TTS is not invoked
- **AND** no podcast is created

### Requirement: Error handling
TTS failures SHALL be handled gracefully.

#### Scenario: TTS conversion fails
- **WHEN** edge-tts returns error
- **AND** retries are exhausted
- **THEN** error is logged
- **AND** report is still saved
- **AND** podcast entry is marked as failed

### Requirement: Cleanup old podcasts
Old podcasts SHALL be automatically cleaned up.

#### Scenario: Cleanup runs
- **WHEN** cleanup task executes
- **AND** podcast is older than PODCAST_RETENTION_DAYS
- **THEN** audio file is deleted
- **AND** database entry is removed
