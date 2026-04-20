import json
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics


def wrap_line_by_width(text, font_name, font_size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
                current = word
            else:
                # Even a single word is too wide; keep it to avoid data loss.
                lines.append(word)
                current = ""
    if current:
        lines.append(current)
    return lines


def build_lines(text, font_name, font_size, max_width):
    out = []
    for raw_line in text.split("\n"):
        raw_line = raw_line.strip()
        if not raw_line:
            out.append("")
            continue
        out.extend(wrap_line_by_width(raw_line, font_name, font_size, max_width))
    return out


def fit_text(text, font_name, base_size, base_leading, max_width, max_height, min_size=8):
    size = int(base_size)
    while size >= min_size:
        if base_size > 0:
            scaled_leading = int(base_leading * (size / base_size))
        else:
            scaled_leading = size + 2
        leading = max(int(size * 1.12), scaled_leading)
        lines = build_lines(text, font_name, size, max_width)
        text_height = len(lines) * leading
        if text_height <= max_height:
            return size, leading, lines
        size -= 1

    # Hard fallback: clip number of lines to available height.
    size = min_size
    leading = max(int(size * 1.12), size + 1)
    lines = build_lines(text, font_name, size, max_width)
    max_lines = max(1, int(max_height // leading))
    return size, leading, lines[:max_lines]


def draw_item(c, page_height, item):
    left = float(item["left"])
    top = float(item["top"])
    width = float(item["width"])
    height = float(item["height"])
    x = left
    y = page_height - (top + height)

    bg = item.get("background_color", [1, 1, 1])
    c.setFillColorRGB(bg[0], bg[1], bg[2])
    c.roundRect(x - 6, y - 5, width + 12, height + 10, 8, stroke=0, fill=1)

    fg = item.get("text_color", [0, 0, 0])
    c.setFillColorRGB(fg[0], fg[1], fg[2])
    font = item.get("font", "Helvetica")
    font_size = int(item.get("font_size", 14))
    leading = int(item.get("leading", font_size + 2))
    text = item.get("text", "")

    text_padding_x = 4
    text_padding_y = 4
    usable_width = max(10, width - (text_padding_x * 2))
    usable_height = max(10, height - (text_padding_y * 2))
    fit_size, fit_leading, lines = fit_text(
        text, font, font_size, leading, usable_width, usable_height
    )

    text_obj = c.beginText()
    text_obj.setTextOrigin(x + text_padding_x, y + height - fit_size - text_padding_y)
    text_obj.setFont(font, fit_size)
    text_obj.setLeading(fit_leading)
    for line in lines:
        text_obj.textLine(line)
    c.drawText(text_obj)


def main():
    here = Path.cwd()
    map_path = Path(
        "openspec/context/pdf_translation/work/pilot-design1-independent-translation-map.json"
    )
    cfg = json.loads(map_path.read_text(encoding="utf-8"))

    input_pdf = here / cfg["input_pdf"]
    output_pdf = here / cfg["output_pdf"]
    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(str(input_pdf))
    writer = PdfWriter()

    items_by_page = {}
    for item in cfg["items"]:
        items_by_page.setdefault(int(item["page"]), []).append(item)

    for idx, page in enumerate(reader.pages):
        mediabox = page.mediabox
        page_width = float(mediabox.width)
        page_height = float(mediabox.height)

        overlay_buf = BytesIO()
        c = canvas.Canvas(overlay_buf, pagesize=(page_width, page_height))
        for item in items_by_page.get(idx, []):
            draw_item(c, page_height, item)
        c.save()

        overlay_buf.seek(0)
        overlay_pdf = PdfReader(overlay_buf)
        if overlay_pdf.pages:
            page.merge_page(overlay_pdf.pages[0])
        writer.add_page(page)

    with output_pdf.open("wb") as f:
        writer.write(f)

    print(str(output_pdf))


if __name__ == "__main__":
    main()
