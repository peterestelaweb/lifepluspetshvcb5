# Delta for CRM

## ADDED Requirements

### Requirement: Core Contact Record
The CRM MUST support core outreach data for PETS contacts.

#### Scenario: Required fields
- WHEN a contact is created
- THEN the record SHALL include name, address, phone, contact method, response, and next step

### Requirement: Follow-Up Management
The CRM MUST support next-step ownership and due dates.

#### Scenario: Follow-up assignment
- WHEN an outreach interaction is logged
- THEN the record SHALL include owner and next-step due date

### Requirement: Pipeline Workflow
The CRM MUST support stage-based progression from first contact to outcome.

#### Scenario: Pipeline update
- WHEN a contact receives a new interaction
- THEN the user SHALL be able to move the record to the correct outreach stage

### Requirement: GDPR Practical Fields
The CRM MUST include legal basis and consent metadata for outreach records.

#### Scenario: Compliance metadata
- WHEN a record is created or updated
- THEN legal basis and consent status SHALL be captured when applicable

### Requirement: Data Export
The CRM MUST support CSV export.

#### Scenario: Export all contacts
- WHEN the user exports data
- THEN the system SHALL produce a CSV file containing all records
