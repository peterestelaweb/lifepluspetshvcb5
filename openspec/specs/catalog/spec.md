# Catalog Specification

## Purpose

Define the verified product catalog, the recommended campaign launch scope, and the messaging boundaries for LifePlus Pets in this workspace.

## Requirements

### Requirement: Verified Product Matrix
The project MUST maintain a verified distinction between locally documented products and externally observed product availability.

#### Scenario: Local product confirmation
- WHEN a product sheet exists in the local workspace
- THEN the product SHALL be considered locally verified

#### Scenario: Web catalog uncertainty
- WHEN a product appears in external web results but not in the local campaign scope
- THEN the product SHALL NOT automatically be treated as active in the campaign

### Requirement: Focused Launch Scope
The phase-1 campaign MUST focus on a limited set of hero products instead of the full technical catalog.

#### Scenario: Phase-1 product selection
- WHEN the marketing plan is drafted
- THEN it SHALL prioritize Pets Basics, Pets Calm, Pets Care & Comfort, and Pets Ahiflower Oil

#### Scenario: Phase-2 expansion
- WHEN the initial campaign foundation is complete
- THEN Pets Move, Pets Digest, Pets Shine, and Pets Peanut Butter Biscuits MAY be introduced as expansion products

### Requirement: Compliance-Safe Messaging
Product messaging MUST use support-oriented language and avoid medical or curative claims.

#### Scenario: Product benefit statements
- WHEN copy is written for product pages, posts, or landing sections
- THEN it SHALL use terms such as supports, helps maintain, contributes to, promotes, or routine care

#### Scenario: Prohibited framing
- WHEN a draft includes treatment, cure, disease, or strong clinical language
- THEN that language MUST be removed or replaced with compliant support wording
