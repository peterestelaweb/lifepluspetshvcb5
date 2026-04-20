import csv
import json
import re
import subprocess
from collections import defaultdict
from io import BytesIO
from pathlib import Path

import argostranslate.translate
from PIL import Image, ImageStat
from pypdf import PdfReader, PdfWriter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


ROOT = Path("/Users/maykacenteno/Development/LIFEPLUS PETS")
SOURCE_DIR = ROOT / "PETS MARKETING MATERIAL"
WORK_DIR = ROOT / "openspec/context/pdf_translation/work/batch"
OUT_DIR = ROOT / "openspec/context/pdf_translation/output/batch"
LOG_PATH = ROOT / "openspec/context/pdf_translation/output/batch-translation-log.json"

WORK_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


def get_translator():
    langs = argostranslate.translate.get_installed_languages()
    from_lang = next((l for l in langs if l.code == "en"), None)
    to_lang = next((l for l in langs if l.code == "es"), None)
    if not from_lang or not to_lang:
        raise RuntimeError("Missing installed Argos language pack en->es.")
    return from_lang.get_translation(to_lang)


TRANSLATOR = get_translator()


def normalize_name(path: Path) -> str:
    return re.sub(r"\s+\(1\)(?=\.pdf$)", "", path.name)


def list_unique_pdfs():
    seen = set()
    out = []
    for pdf in sorted(SOURCE_DIR.glob("*.pdf")):
        key = normalize_name(pdf)
        if key in seen:
            continue
        seen.add(key)
        out.append(pdf)
    return out


def split_pages_to_single_pdfs(pdf_path: Path, base_name: str):
    reader = PdfReader(str(pdf_path))
    single_page_paths = []
    for idx, page in enumerate(reader.pages):
        page_pdf = WORK_DIR / f"{base_name}-p{idx+1}.pdf"
        writer = PdfWriter()
        writer.add_page(page)
        with page_pdf.open("wb") as f:
            writer.write(f)
        single_page_paths.append(page_pdf)
    return single_page_paths, reader


def render_pdf_page_to_png(page_pdf: Path, out_png: Path):
    subprocess.run(
        ["sips", "-s", "format", "png", str(page_pdf), "--out", str(out_png)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def run_tesseract_tsv(png_path: Path, out_base: Path):
    subprocess.run(
        [
            "/opt/homebrew/bin/tesseract",
            str(png_path),
            str(out_base),
            "-l",
            "eng",
            "tsv",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _alpha_count(value: str) -> int:
    return sum(1 for ch in value if ch.isalpha())


def _normalize_ocr_token(text: str) -> str:
    out = text.strip()
    out = out.replace("&apos;", "'").replace("&amp;", "&")
    out = out.replace("’", "'").replace("“", '"').replace("”", '"')
    out = out.replace("™", "TM")
    out = out.replace("®", "®")
    out = re.sub(r"^[\-\•\*]+", "", out)
    out = re.sub(r"[|]{2,}", "|", out)
    out = re.sub(r"\s+", " ", out).strip()
    return out


def parse_tsv_blocks(tsv_path: Path):
    word_groups = defaultdict(list)
    with tsv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row["level"] != "5":
                continue
            text = _normalize_ocr_token(row["text"])
            if not text:
                continue
            conf = float(row["conf"]) if row["conf"] not in ("", "-1") else -1.0
            if conf < 45:
                continue
            row["text"] = text
            row["conf"] = conf
            word_groups[(row["block_num"], row["par_num"], row["line_num"])].append(row)

    blocks = []
    for _, words in word_groups.items():
        words = sorted(words, key=lambda x: (int(x["line_num"]), int(x["left"])))
        segments = []
        segment = []
        prev_right = None
        for w in words:
            left = int(w["left"])
            width = int(w["width"])
            gap = 0 if prev_right is None else (left - prev_right)
            threshold = max(34, int(2.0 * max(1, width)))
            if segment and gap > threshold:
                segments.append(segment)
                segment = []
            segment.append(w)
            prev_right = left + width
        if segment:
            segments.append(segment)

        kept_words = []
        text_chunks = []
        for seg in segments:
            seg_text = " ".join(w["text"] for w in seg).strip()
            if _alpha_count(seg_text) < 2:
                continue
            if len(seg_text) <= 2 and seg_text.isupper():
                continue
            text_chunks.append(seg_text)
            kept_words.extend(seg)

        if not kept_words or not text_chunks:
            continue

        left = min(int(w["left"]) for w in kept_words)
        top = min(int(w["top"]) for w in kept_words)
        right = max(int(w["left"]) + int(w["width"]) for w in kept_words)
        bottom = max(int(w["top"]) + int(w["height"]) for w in kept_words)
        width = right - left
        height = bottom - top
        avg_conf = sum(float(w["conf"]) for w in kept_words) / len(kept_words)
        blocks.append(
            {
                "text": " ".join(text_chunks),
                "left": left,
                "top": top,
                "width": width,
                "height": height,
                "line_count": 1,
                "avg_conf": avg_conf,
            }
        )

    return sorted(blocks, key=lambda x: (x["top"], x["left"]))


def clean_source_text(text: str) -> str:
    lines = []
    for raw in text.splitlines():
        line = _normalize_ocr_token(raw)
        line = re.sub(r"^\d+\s+(?=[A-Za-z])", "", line)
        line = re.sub(r"\s*\|\s*[A-Za-z]\s*$", "", line)
        line = re.sub(r"\bShopID\b.*$", "", line, flags=re.I)
        line = re.sub(r"\bShop URL\b.*$", "", line, flags=re.I)
        line = re.sub(r"\bwww\.[^\s]+", "", line, flags=re.I)
        line = re.sub(r"\s+", " ", line).strip()
        if _alpha_count(line) < 2:
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def should_translate_block(block):
    if block["width"] < 60 or block["height"] < 10:
        return False
    if block.get("avg_conf", 100) < 55:
        return False
    source = clean_source_text(block["text"])
    if not source:
        return False
    if len(source) < 8:
        return False
    lowered = source.lower()
    if lowered.startswith("shopid") or lowered.startswith("shop url"):
        return False
    alpha = _alpha_count(source)
    if alpha / max(len(source), 1) < 0.45:
        return False
    return True


EXACT_TRANSLATIONS = {
    "because": "porque",
    "your dog": "tu perro",
    "deserves": "merece",
    "feel-good skin": "una piel que se siente bien",
    "skin": "piel",
    "how does ahiflower support skin function in dogs?": "¿cómo ayuda ahiflower a la función de la piel en perros?",
    "adds shine without mess or fishy smells": "aporta brillo sin ensuciar ni dejar olor a pescado",
    "supports healthy skin texture and coat softness": "apoya una textura de piel saludable y un pelaje suave",
    "a glow-up for every breed, every day": "un impulso de brillo para cada raza, cada día",
    "by serious omegas°": "por omegas potentes°",
    "powered by omega 3, 6,": "alimentado por omega 3, 6,",
    "and antioxidants®": "y antioxidantes®",
    "and antioxidants°": "y antioxidantes°",
    "help protect your pet's skin": "ayuda a proteger la piel de tu mascota",
    "for canine skin": "para la piel canina",
    "skin care. coat": "cuidado de la piel. del pelaje.",
    "care. pup care°.": "cuidado para cachorros.",
    "and coat care°®": "y cuidado del pelaje",
    "greasy messes®": "sin grasa ni suciedad®",
    "\"these statements have not been evaluated by the food and drug administration.": "\"estas declaraciones no han sido evaluadas por la administración de alimentos y medicamentos.",
    "this product is not intended to diagnose, treat, cure or prevent any disease.": "este producto no está destinado a diagnosticar, tratar, curar o prevenir ninguna enfermedad.",
    "this product is intended for the u.s. market only.": "este producto está destinado únicamente al mercado de ee. uu.",
}


RESIDUAL_REPLACEMENTS = {
    " and ": " y ",
    " the ": " el ",
    " soft coats": " pelaje suave",
    " soft coat": " pelaje suave",
    " coat ": " pelaje ",
    " coats ": " pelajes ",
    " skin ": " piel ",
    " care ": " cuidado ",
    " health ": " salud ",
    " healthy ": " saludable ",
    " pup ": " cachorro ",
    " fish oils": " aceites de pescado",
}

ENGLISH_RESIDUAL_WORDS = {
    "and",
    "the",
    "soft",
    "coat",
    "coats",
    "care",
    "health",
    "healthy",
    "pup",
    "pups",
    "fish",
    "oils",
    "forget",
    "boring",
    "spotlight",
    "better",
    "hair",
    "why",
    "does",
    "have",
    "my",
    "now",
}


MANUAL_OVERRIDES = {
    "Pets-Ahiflower-Oil-Design-2-Carousels-US-Bienvenidos-a-lifeplus.pdf": {
        1: [
            {
                "left": 62,
                "top": 225,
                "width": 560,
                "height": 95,
                "text": "Aceites saludables.",
                "font_size": 24,
                "bg": [0.76, 0.42, 0.66],
                "fg": [1, 1, 1],
                "radius": 34,
            },
            {
                "left": 250,
                "top": 360,
                "width": 580,
                "height": 110,
                "text": "Perro feliz.",
                "font_size": 28,
                "bg": [0.69, 0.79, 0.32],
                "fg": [1, 1, 1],
                "radius": 34,
            },
        ]
    },
    "Pets-Ahiflower-Oil-Design-5-Independent-US-Bienvenidos-a-lifeplus.pdf": {
        1: [
            {
                "left": 110,
                "top": 56,
                "width": 850,
                "height": 205,
                "text": "¿POR QUÉ MI PERRO TIENE MEJOR PELO QUE YO AHORA?",
                "font_size": 28,
            },
            {
                "left": 176,
                "top": 774,
                "width": 360,
                "height": 34,
                "text": "Y ANTIOXIDANTES°",
                "font_size": 30,
            }
        ]
    }
}


def has_residual_english(text: str) -> bool:
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    if not words:
        return False
    return any(w in ENGLISH_RESIDUAL_WORDS for w in words)


def postprocess_translation(text: str) -> str:
    out = text
    for src, dst in RESIDUAL_REPLACEMENTS.items():
        out = out.replace(src, dst)
    out = re.sub(r"\bflakiness\b", "descamación", out, flags=re.I)
    out = re.sub(r"\bsoft\b", "suave", out, flags=re.I)
    out = re.sub(r"\bhealth\b", "salud", out, flags=re.I)
    out = re.sub(r"\s+", " ", out).strip()
    out = out.replace("Ahiflower", "Ahiflower").replace("Lifeplus", "Lifeplus")
    return out


def translate_line(source_line: str) -> str:
    src = clean_source_text(source_line)
    if not src:
        return ""

    key = src.lower()
    if key in EXACT_TRANSLATIONS:
        translated = EXACT_TRANSLATIONS[key]
    else:
        translated = TRANSLATOR.translate(src.lower()).strip()
        if not translated:
            translated = src
    translated = postprocess_translation(f" {translated} ")
    translated = translated.strip()

    if src.isupper() and len(src.split()) <= 8:
        translated = translated.upper()
    return translated


def translate_block_text(source: str) -> str:
    out_lines = []
    for line in source.splitlines():
        translated = translate_line(line)
        if translated:
            out_lines.append(translated)
    out = "\n".join(out_lines).strip()
    if has_residual_english(out):
        out = postprocess_translation(out)
    return out


def estimate_background_color(img: Image.Image, box):
    left, top, width, height = box
    margin = 6
    strip = 6
    x1 = max(0, left - margin)
    y1 = max(0, top - margin)
    x2 = min(img.width, left + width + margin)
    y2 = min(img.height, top + height + margin)

    samples = []
    if y1 + strip < y2:
        samples.append(img.crop((x1, y1, x2, min(y2, y1 + strip))))
    if y2 - strip > y1:
        samples.append(img.crop((x1, max(y1, y2 - strip), x2, y2)))
    if x1 + strip < x2:
        samples.append(img.crop((x1, y1, min(x2, x1 + strip), y2)))
    if x2 - strip > x1:
        samples.append(img.crop((max(x1, x2 - strip), y1, x2, y2)))

    if not samples:
        crop = img.crop((x1, y1, x2, y2))
        stat = ImageStat.Stat(crop)
        mean = stat.mean[:3]
        return [m / 255.0 for m in mean]

    rgb = [0.0, 0.0, 0.0]
    for crop in samples:
        stat = ImageStat.Stat(crop)
        mean = stat.mean[:3]
        rgb[0] += mean[0]
        rgb[1] += mean[1]
        rgb[2] += mean[2]
    count = len(samples)
    return [(v / max(count, 1)) / 255.0 for v in rgb]


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
                lines.append(word)
                current = ""
    if current:
        lines.append(current)
    return lines


def fit_text_block(text, font_name, base_size, max_width, max_height):
    source_lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not source_lines:
        return max(10, base_size), max(12, int(base_size * 1.2)), []

    min_size = max(9, int(base_size * 0.72))
    for size in range(base_size, min_size - 1, -1):
        leading = max(size + 2, int(size * 1.2))
        rendered = []
        for src_line in source_lines:
            rendered.extend(wrap_line_by_width(src_line, font_name, size, max_width))
        if not rendered:
            continue
        total_h = size + (len(rendered) - 1) * leading
        if total_h <= max_height:
            return size, leading, rendered

    fallback_size = min_size
    fallback_leading = max(fallback_size + 2, int(fallback_size * 1.2))
    rendered = []
    for src_line in source_lines:
        rendered.extend(wrap_line_by_width(src_line, font_name, fallback_size, max_width))
    max_lines = max(1, int(max_height // fallback_leading))
    return fallback_size, fallback_leading, rendered[:max_lines]


def draw_overlay_item(c, page_height, item):
    x = float(item["left"])
    top = float(item["top"])
    width = float(item["width"])
    height = float(item["height"])
    y = page_height - (top + height)

    bg = item["bg"]
    fg = item["fg"]
    pad = 4
    radius = float(item.get("radius", 4))
    c.setFillColorRGB(bg[0], bg[1], bg[2])
    c.roundRect(
        x - pad,
        y - pad,
        width + (2 * pad),
        height + (2 * pad),
        radius,
        stroke=0,
        fill=1,
    )

    font = "Helvetica"
    base_size = int(item["font_size"])
    usable_w = max(20, width - 4)
    usable_h = max(20, height - 4)
    fit_size, fit_leading, lines = fit_text_block(
        item["translated"], font, base_size, usable_w, usable_h
    )

    c.setFillColorRGB(fg[0], fg[1], fg[2])
    t = c.beginText()
    t.setTextOrigin(x + 2, y + height - fit_size - 2)
    t.setFont(font, fit_size)
    t.setLeading(fit_leading)
    for line in lines:
        t.textLine(line)
    c.drawText(t)


def apply_residual_english_pass(out_pdf: Path, base_name: str):
    reader = PdfReader(str(out_pdf))
    page_overlays = defaultdict(list)
    corrections = 0

    for page_index, page in enumerate(reader.pages):
        page_pdf = WORK_DIR / f"{base_name}-post-p{page_index+1}.pdf"
        page_writer = PdfWriter()
        page_writer.add_page(page)
        with page_pdf.open("wb") as f:
            page_writer.write(f)

        img_path = WORK_DIR / f"{base_name}-post-p{page_index+1}.png"
        out_base = WORK_DIR / f"{base_name}-post-p{page_index+1}-ocr"
        tsv_path = WORK_DIR / f"{base_name}-post-p{page_index+1}-ocr.tsv"

        render_pdf_page_to_png(page_pdf, img_path)
        run_tesseract_tsv(img_path, out_base)
        blocks = parse_tsv_blocks(tsv_path)
        image = Image.open(img_path).convert("RGB")

        for block in blocks:
            source = clean_source_text(block["text"])
            if not source:
                continue
            if not has_residual_english(source):
                continue
            lowered = source.lower()
            if lowered.startswith("shopid") or lowered.startswith("shop url") or "www." in lowered:
                continue

            translated = translate_line(source)
            if not translated or translated.lower() == source.lower():
                continue

            bg = estimate_background_color(
                image, (block["left"], block["top"], block["width"], block["height"])
            )
            luminance = (0.299 * bg[0]) + (0.587 * bg[1]) + (0.114 * bg[2])
            fg = [1, 1, 1] if luminance < 0.52 else [0, 0, 0]
            font_size = int(max(11, min(40, block["height"] * 0.90)))

            page_overlays[page_index].append(
                {
                    "left": block["left"],
                    "top": block["top"],
                    "width": block["width"],
                    "height": block["height"],
                    "source": source,
                    "translated": translated,
                    "bg": bg,
                    "fg": fg,
                    "font_size": font_size,
                }
            )
            corrections += 1

    if corrections == 0:
        return 0

    writer = PdfWriter()
    for idx, page in enumerate(reader.pages):
        box = page.mediabox
        width = float(box.width)
        height = float(box.height)
        overlay_buf = BytesIO()
        c = canvas.Canvas(overlay_buf, pagesize=(width, height))
        for item in page_overlays.get(idx, []):
            draw_overlay_item(c, height, item)
        c.save()
        overlay_buf.seek(0)
        overlay_reader = PdfReader(overlay_buf)
        if overlay_reader.pages:
            page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    with out_pdf.open("wb") as f:
        writer.write(f)
    return corrections


def process_pdf(pdf_path: Path):
    normalized_pdf_name = normalize_name(pdf_path)
    base = normalized_pdf_name.replace(".pdf", "").replace(" ", "_")
    pages, original_reader = split_pages_to_single_pdfs(pdf_path, base)

    page_overlays = defaultdict(list)
    summary = {"pdf": pdf_path.name, "pages": []}

    for page_index, page_pdf in enumerate(pages):
        img_path = WORK_DIR / f"{base}-p{page_index+1}.png"
        out_base = WORK_DIR / f"{base}-p{page_index+1}-ocr"
        tsv_path = WORK_DIR / f"{base}-p{page_index+1}-ocr.tsv"

        render_pdf_page_to_png(page_pdf, img_path)
        run_tesseract_tsv(img_path, out_base)
        blocks = parse_tsv_blocks(tsv_path)
        image = Image.open(img_path).convert("RGB")

        translated_count = 0
        for block in blocks:
            if not should_translate_block(block):
                continue
            source = clean_source_text(block["text"])
            translated = translate_block_text(source)
            if not translated or translated.lower() == source.lower():
                continue

            bg = estimate_background_color(
                image, (block["left"], block["top"], block["width"], block["height"])
            )
            luminance = (0.299 * bg[0]) + (0.587 * bg[1]) + (0.114 * bg[2])
            fg = [1, 1, 1] if luminance < 0.52 else [0, 0, 0]

            line_count = max(1, block["line_count"])
            line_height = block["height"] / line_count
            font_size = int(max(11, min(40, line_height * 0.90)))

            page_overlays[page_index].append(
                {
                    "left": block["left"],
                    "top": block["top"],
                    "width": block["width"],
                    "height": block["height"],
                    "source": source,
                    "translated": translated,
                    "bg": bg,
                    "fg": fg,
                    "font_size": font_size,
                }
            )
            translated_count += 1

        page_no = page_index + 1
        for override in MANUAL_OVERRIDES.get(normalized_pdf_name, {}).get(page_no, []):
            bg = override.get("bg")
            if not bg:
                bg = estimate_background_color(
                    image,
                    (
                        int(override["left"]),
                        int(override["top"]),
                        int(override["width"]),
                        int(override["height"]),
                    ),
                )
            fg = override.get("fg")
            if not fg:
                luminance = (0.299 * bg[0]) + (0.587 * bg[1]) + (0.114 * bg[2])
                fg = [1, 1, 1] if luminance < 0.52 else [0, 0, 0]
            page_overlays[page_index].append(
                {
                    "left": override["left"],
                    "top": override["top"],
                    "width": override["width"],
                    "height": override["height"],
                    "source": "manual-override",
                    "translated": override["text"],
                    "bg": bg,
                    "fg": fg,
                    "font_size": override["font_size"],
                    "radius": override.get("radius", 4),
                }
            )
            translated_count += 1

        summary["pages"].append(
            {
                "page": page_index + 1,
                "detected_blocks": len(blocks),
                "translated_blocks": translated_count,
            }
        )

    writer = PdfWriter()
    for idx, page in enumerate(original_reader.pages):
        box = page.mediabox
        width = float(box.width)
        height = float(box.height)
        overlay_buf = BytesIO()
        c = canvas.Canvas(overlay_buf, pagesize=(width, height))
        for item in page_overlays.get(idx, []):
            draw_overlay_item(c, height, item)
        c.save()
        overlay_buf.seek(0)
        overlay_reader = PdfReader(overlay_buf)
        if overlay_reader.pages:
            page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    out_pdf = OUT_DIR / f"{normalize_name(pdf_path).replace('.pdf', '')}-ES.pdf"
    with out_pdf.open("wb") as f:
        writer.write(f)

    post_corrections = apply_residual_english_pass(out_pdf, base)

    summary["output_pdf"] = str(out_pdf)
    summary["translated_blocks_total"] = sum(p["translated_blocks"] for p in summary["pages"])
    summary["post_residual_corrections"] = post_corrections
    return summary


def main():
    summaries = []
    for pdf in list_unique_pdfs():
        summaries.append(process_pdf(pdf))

    LOG_PATH.write_text(json.dumps(summaries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"processed": len(summaries), "log": str(LOG_PATH)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
