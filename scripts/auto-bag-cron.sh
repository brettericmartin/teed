#!/usr/bin/env bash
set -euo pipefail

# Auto-Bag Cron — Orchestrator
# Runs every 12 hours via crontab:
#   0 6,18 * * * /home/brettm/development/teed/teed/scripts/auto-bag-cron.sh
#
# Phase 1: Pre-search (cheap, ~60s, ~$0.05-0.10)
# Phase 2: Claude CLI scoring + extraction + bag creation (~5-15 min, ~$1-3)
#
# Budget cap: $5.00 per run

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/tmp/teed-auto-bag-logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/auto-bag-${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=========================================="
echo "Auto-Bag Pipeline — $(date)"
echo "=========================================="

# ── Phase 1: Pre-search ─────────────────────────────────────────────

echo ""
echo "[Phase 1] Running pre-search..."

if ! bash "$SCRIPT_DIR/auto-bag-search.sh"; then
  echo "[ERROR] Pre-search failed. Exiting."
  exit 1
fi

# Check for results
CANDIDATE_FILE="/tmp/teed-auto-bag-candidates.json"
if [ ! -f "$CANDIDATE_FILE" ]; then
  echo "[$(date)] No candidate file generated. Exiting."
  exit 0
fi

CANDIDATE_COUNT=$(python3 -c "import json; print(len(json.load(open('$CANDIDATE_FILE')).get('candidates',[])))" 2>/dev/null || echo "0")

echo "[$(date)] Candidates found: $CANDIDATE_COUNT"

if [ "$CANDIDATE_COUNT" -eq "0" ]; then
  echo "[$(date)] Zero candidates. Exiting."
  exit 0
fi

# ── Phase 2: Claude CLI ─────────────────────────────────────────────

echo ""
echo "[Phase 2] Running Claude CLI for scoring + bag creation..."
echo "[$(date)] Budget cap: \$5.00"

cd "$PROJECT_DIR"
set -a && source .env.local && set +a
unset CLAUDECODE 2>/dev/null || true

claude -p "$(cat "$SCRIPT_DIR/auto-bag-prompt.md")" \
  --dangerously-skip-permissions \
  --max-budget-usd 5.00 \
  2>&1 || echo "[WARN] Claude CLI exited with non-zero status"

echo ""
echo "[$(date)] Pipeline complete."

# ── Cleanup ──────────────────────────────────────────────────────────

# Remove logs older than 7 days
find "$LOG_DIR" -name "auto-bag-*.log" -mtime +7 -delete 2>/dev/null || true

# Remove temp files
rm -f /tmp/teed-search-*.json /tmp/teed-auto-bag-candidates.json
rm -f /tmp/teed-transcript* 2>/dev/null || true

echo "[$(date)] Cleanup done."
