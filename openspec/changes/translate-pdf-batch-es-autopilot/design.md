# Design Notes

## Batch Translation Flow

1. Enumerate PDFs in source folder and deduplicate filenames with ` (1)` suffix.
2. Split PDFs page by page for OCR handling.
3. Render each page to PNG and extract line-level OCR with Tesseract TSV.
4. Translate valid English lines to Spanish using Argos Translate (`en -> es`).
5. Draw translated text overlays with background color sampling and auto-fit typography.
6. Merge overlays back into original PDFs and write final outputs to batch folder.

## Autopilot Strategy

- provide a shell runner that:
  - sets local XDG paths for Argos assets/cache
  - writes persistent run logs with timestamps
  - retries automatically after failures
- keep all artifacts inside OpenSpec context paths for traceability

## Risks and Constraints

- OCR quality depends on source image quality and small text may be skipped.
- Overlay replacement preserves layout but may not be pixel-identical to original design.
