# PETS CRM (Local MVP)

## What this is

A lightweight local CRM to track PETS outreach contacts and follow-ups.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `contacts-template.csv`

## How to use

1. Open `index.html` in your browser.
2. Add contacts from clinics, groups, trainers, or stores.
3. Update `pipeline_stage`, `response_status` and `next_step` after every interaction.
4. Export CSV regularly for backup.

## Notes

- Data is stored in browser localStorage.
- Use one primary browser/profile to avoid fragmented records.
- New records require `organization_name`, one channel (`phone` or `email`), `next_step`, and `next_step_due`.
- Includes practical privacy fields: `legal_basis`, `consent_status`, and `retention_review_at`.
