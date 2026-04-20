# Design Notes

## Approach

Build a file-based CRM MVP in plain HTML/CSS/JS so it can run instantly without backend dependencies.

## Tradeoffs

- Pros: zero setup, immediate usage, easy backup/export
- Cons: local-only storage by default (browser localStorage), no multi-user sync

## Data Model

Each contact record includes:

- id
- contact_type
- organization_name
- contact_name
- address
- phone
- email
- preferred_contact_method
- last_contact_date
- response_status
- response_notes
- next_step
- next_step_due
- owner
- priority
- source
- created_at
- updated_at

## Next Technical Upgrade (Optional)

If team usage grows, migrate to shared backend (Supabase/Airtable/Postgres) while preserving the same field schema.
