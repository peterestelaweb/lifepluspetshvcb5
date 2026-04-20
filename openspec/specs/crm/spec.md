# CRM Specification

## Purpose

Define a lightweight CRM for PETS outreach contacts (clinics, communities, and related partners), with full follow-up traceability.

## Requirements

### Requirement: Core Contact Record
The CRM MUST support the core fields requested by the team.

#### Scenario: Creating a contact
- WHEN a new outreach contact is added
- THEN the record SHALL include at minimum: name, address, phone, contact method, response, and next step

### Requirement: Follow-Up Management
The CRM MUST support actionable follow-up planning.

#### Scenario: Defining a next action
- WHEN a record is updated after an interaction
- THEN the user SHALL be able to define next step, due date, and owner

### Requirement: Pipeline Stages
The CRM MUST support a stage-based outreach workflow.

#### Scenario: Stage tracking
- WHEN a contact advances in outreach
- THEN the record SHALL allow setting a pipeline stage (for example nuevo, intentos, conversacion, interesado, propuesta, negociacion, ganado, perdido, nurture)

### Requirement: Privacy Metadata
The CRM MUST include practical privacy control fields for Spain/UE operations.

#### Scenario: Legal basis registration
- WHEN a contact is stored
- THEN the record SHALL include legal basis and consent status when applicable

#### Scenario: Retention review
- WHEN a contact remains inactive
- THEN the record SHALL support a retention review date for periodic cleanup

### Requirement: Segment Awareness
The CRM MUST distinguish contact categories for PETS campaigns.

#### Scenario: Contact classification
- WHEN a record is created
- THEN it SHALL include a type (for example veterinary clinic, dog community, trainer, breeder, pet store, other)

### Requirement: Data Export
The CRM MUST allow easy extraction for reporting and backups.

#### Scenario: Exporting records
- WHEN the user requests export
- THEN the CRM SHALL provide a CSV with all stored records

### Requirement: Privacy-Safe Notes
The CRM MUST avoid unnecessary sensitive data.

#### Scenario: Writing response notes
- WHEN notes are saved
- THEN they SHALL be limited to outreach-relevant information and must not include medical records or unnecessary sensitive personal data
