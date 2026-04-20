# Agent Research Synthesis

## Inputs Received

Three parallel research agents were used:

- `crm_schema_research`
- `crm_workflow_research`
- `crm_privacy_research`

## Decisions Applied

### 1) Schema

Applied:

- required business fields from original request
- owner + next-step due date
- contact categorization by entity type

Added:

- pipeline stage
- legal basis
- consent status
- retention review date

### 2) Workflow

Applied:

- stage model from `nuevo` to `ganado/perdido/en_nurture`
- next-step with due date as mandatory operational rule

### 3) Privacy

Applied:

- practical metadata for Spain/UE outreach operations
- avoid unnecessary sensitive data
- support retention review process

## Notes

This MVP is local and single-user by design (browser localStorage).  
If team usage becomes multi-user, the same data model can migrate to a shared backend.
