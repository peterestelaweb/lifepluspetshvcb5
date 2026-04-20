# Delta for PDF Translation (Batch + Autopilot)

## ADDED Requirements

### Requirement: Full-Batch Coverage
The workflow MUST support translating all unique PETS source PDFs in the marketing materials folder.

#### Scenario: Batch execution
- WHEN a full translation run is started
- THEN the system SHALL process each unique PDF and produce a Spanish output PDF for each one

### Requirement: Persistent Batch Logging
The workflow MUST persist an auditable translation log for every batch run.

#### Scenario: Run completion
- WHEN a batch run finishes
- THEN the system SHALL write a JSON log with per-file and per-page translation counts

### Requirement: Unattended Retry Runner
The workflow MUST provide an unattended runner that can continue after transient errors.

#### Scenario: transient failure
- WHEN the batch command exits with a non-zero code
- THEN the runner SHALL wait and retry automatically until success or manual stop
