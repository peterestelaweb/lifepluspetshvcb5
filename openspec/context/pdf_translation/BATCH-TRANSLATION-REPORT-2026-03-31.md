# Batch Translation Report — 2026-03-31

## Scope

- Source folder: `/Users/maykacenteno/Development/LIFEPLUS PETS/PETS MARKETING MATERIAL`
- Mode: full batch, deduplicating duplicate ` (1)` filenames
- Target language: Spanish (`en -> es`)

## Result

- Processed unique PDFs: 9
- Source PDFs (including duplicates): 11
- Processed pages: 18
- Translated OCR lines (total): 149
- Output folder:
  `/Users/maykacenteno/Development/LIFEPLUS PETS/openspec/context/pdf_translation/output/batch`
- Output folder (1:1 with source files):
  `/Users/maykacenteno/Development/LIFEPLUS PETS/openspec/context/pdf_translation/output/by_source`
- Structured log:
  `/Users/maykacenteno/Development/LIFEPLUS PETS/openspec/context/pdf_translation/output/batch-translation-log.json`

## Output PDFs

- `Pets-Ahiflower-Oil-Design-1-Carousels-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-1-Independent-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-2-Carousels-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-2-Independent-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-3-Carousels-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-5-Carousels-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-5-Independent-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-6-Carousels-US-Bienvenidos-a-lifeplus-ES.pdf`
- `Pets-Ahiflower-Oil-Design-6-Independent-US-Bienvenidos-a-lifeplus-ES.pdf`

## Notes

- A previous overlap issue on Design 1 independent was corrected before this batch rollout.
- OCR/overlay replacement preserves original image composition and placement intent, but exact pixel-level reproduction is not guaranteed.
- Batch engine was improved with:
  - line segmentation by OCR gaps
  - better uppercase translation handling
  - cleaner background sampling for overlays
  - artifact cleanup for common OCR noise
  - exact phrase dictionary for known marketing lines
  - manual overrides for low-detection headline zones
  - post-pass residual-English correction on generated PDFs
- Unattended runner script available at:
  `/Users/maykacenteno/Development/LIFEPLUS PETS/openspec/context/pdf_translation/tools/run_batch_autopilot.sh`

## Autopilot Run Command

```bash
cd "/Users/maykacenteno/Development/LIFEPLUS PETS"
nohup ./openspec/context/pdf_translation/tools/run_batch_autopilot.sh >/dev/null 2>&1 &
```

Autopilot log:
`/Users/maykacenteno/Development/LIFEPLUS PETS/openspec/context/pdf_translation/output/batch-autopilot.log`
