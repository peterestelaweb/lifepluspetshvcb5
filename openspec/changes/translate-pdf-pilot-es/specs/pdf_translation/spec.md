# Delta for PDF Translation

## ADDED Requirements

### Requirement: OCR Extraction
The workflow MUST extract source text from non-selectable PDF text regions.

#### Scenario: OCR pass
- WHEN source page text cannot be extracted by normal PDF text parsing
- THEN OCR SHALL provide translatable text segments and region coordinates

### Requirement: Layout-Conscious Replacement
The workflow MUST replace translated text in equivalent page regions.

#### Scenario: Region overlay
- WHEN Spanish text is applied
- THEN the output SHALL preserve overall page composition and product imagery while updating text content

### Requirement: Pilot Validation
The workflow MUST produce and review a pilot output before batch translation.

#### Scenario: Pilot approval gate
- WHEN the first translated PDF is generated
- THEN visual QA SHALL be completed before processing additional files
