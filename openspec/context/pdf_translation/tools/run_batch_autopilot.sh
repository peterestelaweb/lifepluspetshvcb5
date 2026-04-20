#!/bin/zsh
set -u

ROOT="/Users/maykacenteno/Development/LIFEPLUS PETS"
LOG_DIR="$ROOT/openspec/context/pdf_translation/output"
LOG_FILE="$LOG_DIR/batch-autopilot.log"
SCRIPT="$ROOT/openspec/context/pdf_translation/tools/batch_translate_marketing_pdfs.py"

mkdir -p "$LOG_DIR"
mkdir -p "$ROOT/tmp/xdg" "$ROOT/tmp/xdg_cache"

export XDG_DATA_HOME="$ROOT/tmp/xdg"
export XDG_CACHE_HOME="$ROOT/tmp/xdg_cache"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] autopilot started" >> "$LOG_FILE"

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] running batch translation" >> "$LOG_FILE"
  python3 "$SCRIPT" >> "$LOG_FILE" 2>&1
  code=$?
  if [ "$code" -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] completed successfully" >> "$LOG_FILE"
    exit 0
  fi
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] failed with code $code; retry in 60s" >> "$LOG_FILE"
  sleep 60
done
