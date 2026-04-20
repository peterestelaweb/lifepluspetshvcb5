# Proposal: Translate All PETS PDFs to Spanish with Autopilot Runner

## Why

The team requested full translation of all PETS marketing PDFs to Spanish and a way to keep execution running unattended.

## What Changes

- run full-batch translation across all unique source PDFs in `PETS MARKETING MATERIAL/`
- keep outputs and run logs under `openspec/context/pdf_translation/output/`
- add an autopilot shell runner with automatic retries and persistent logs
- record run results in OpenSpec context for handoff

## Expected Outcome

A complete translated PDF set, auditable logs, and an unattended execution path that can continue without operator presence.
