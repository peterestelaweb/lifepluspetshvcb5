# Design Notes

## Chosen Approach

1. Render pilot page image from source PDF.
2. Run OCR to extract line-level text and rough regions.
3. Translate copy manually with meaning preservation.
4. Create vector overlay with replacement Spanish text.
5. Merge overlay into original PDF page.

## Why This Approach

- Works with image-heavy marketing PDFs where text is not selectable.
- Keeps source page composition and imagery intact.
- Produces an auditable mapping between source and replacement text.

## Limitation

When source text is baked into images, perfect pixel-level replacement is not guaranteed.  
The workflow minimizes visual disruption but still uses region overlays to replace text.
