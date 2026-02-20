#!/usr/bin/env bash
set -euo pipefail

# Auto-Bag Search: Pre-search phase using last30days.py
# Rotates through 5 of 10 categories per run (date-seeded).
# Outputs merged candidates to /tmp/teed-auto-bag-candidates.json
#
# Cost: ~$0.05-0.10 per run (5 quick searches)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAST30DAYS="$HOME/.claude/skills/last30days/scripts/last30days.py"
OUTPUT_FILE="/tmp/teed-auto-bag-candidates.json"
SEARCH_DIR="/tmp/teed-search-results"

mkdir -p "$SEARCH_DIR"

# ── Category definitions with product-list-tuned queries ─────────────

declare -A QUERIES
QUERIES[edc]="EDC haul OR pocket dump OR everyday carry gear top picks"
QUERIES[tech]="tech haul OR desk setup OR gadget essentials top 10"
QUERIES[golf]="golf WITB OR what's in the bag OR new golf equipment review"
QUERIES[fitness]="gym bag essentials OR fitness gear haul OR home gym setup"
QUERIES[cooking]="kitchen gadgets haul OR cooking essentials OR kitchen tools top picks"
QUERIES[fashion]="fashion haul OR wardrobe essentials OR outfit breakdown capsule"
QUERIES[photography]="camera gear haul OR photography kit essentials OR camera bag tour"
QUERIES[outdoor]="outdoor gear haul OR hiking essentials OR camping gear top picks"
QUERIES[gaming]="gaming setup tour OR gaming gear haul OR gaming desk accessories"
QUERIES[travel]="travel essentials haul OR packing list OR travel gear top picks"

ALL_CATEGORIES=(edc tech golf fitness cooking fashion photography outdoor gaming travel)

# ── Date-seeded category rotation: 5 of 10 per run ──────────────────
# Stride-2 selection ensures all 10 categories covered every 2 runs.
# Day 1: indices 1,3,5,7,9 → Day 2: indices 2,4,6,8,0 → Day 3: 3,5,7,9,1 ...

DAY_OF_YEAR=$(date +%j)
OFFSET=$((DAY_OF_YEAR % 10))
SELECTED=()
for i in 0 1 2 3 4; do
  IDX=$(( (OFFSET + i * 2) % 10 ))
  SELECTED+=("${ALL_CATEGORIES[$IDX]}")
done

echo "[$(date)] Auto-bag search starting"
echo "[$(date)] Categories this run: ${SELECTED[*]}"

# ── Run searches in parallel ─────────────────────────────────────────

PIDS=()
for category in "${SELECTED[@]}"; do
  query="${QUERIES[$category]}"
  outfile="$SEARCH_DIR/search-${category}.json"

  (
    echo "[$(date)] Searching: $category" >&2
    python3 "$LAST30DAYS" "$query" \
      --days=1 \
      --quick \
      --emit=json \
      > "$outfile" 2>/dev/null || echo '{"reddit":[],"youtube":[],"web":[]}' > "$outfile"
    echo "[$(date)] Done: $category" >&2
  ) &
  PIDS+=($!)
done

# Wait for all searches to complete
for pid in "${PIDS[@]}"; do
  wait "$pid" 2>/dev/null || true
done

echo "[$(date)] All searches complete. Merging results..."

# ── Merge and normalize results ──────────────────────────────────────
# Combine reddit + youtube + web items from all categories into a
# single candidates array with consistent schema.

python3 -c "
import json, glob, sys, os
from datetime import datetime, timezone

def safe_load_json(fpath):
    '''Load JSON from file, handling trailing non-JSON content.'''
    with open(fpath) as f:
        text = f.read()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try parsing just the first JSON object (handles trailing text)
        decoder = json.JSONDecoder()
        obj, _ = decoder.raw_decode(text.lstrip())
        return obj

candidates = []
categories_searched = []
search_dir = '$SEARCH_DIR'

for category in '${SELECTED[*]}'.split():
    fpath = os.path.join(search_dir, f'search-{category}.json')
    if not os.path.exists(fpath):
        continue

    categories_searched.append(category)

    try:
        data = safe_load_json(fpath)
    except (json.JSONDecodeError, IOError, ValueError):
        continue

    # Process YouTube results
    for item in (data.get('youtube') or []):
        eng = item.get('engagement') or {}
        candidates.append({
            'source_platform': 'youtube',
            'category_hint': category,
            'title': item.get('title', ''),
            'url': item.get('url', ''),
            'channel_or_author': item.get('channel_name', ''),
            'date': item.get('date', ''),
            'engagement': {
                'views': eng.get('views', 0),
                'likes': eng.get('likes', 0),
                'comments': eng.get('num_comments', 0),
            },
            'content_snippet': item.get('transcript_snippet', ''),
            'pre_score': item.get('score', 0),
        })

    # Process Reddit results
    for item in (data.get('reddit') or []):
        eng = item.get('engagement') or {}
        candidates.append({
            'source_platform': 'reddit',
            'category_hint': category,
            'title': item.get('title', ''),
            'url': item.get('url', ''),
            'channel_or_author': 'r/' + item.get('subreddit', ''),
            'date': item.get('date', ''),
            'engagement': {
                'score': eng.get('score', 0),
                'comments': eng.get('num_comments', 0),
                'upvote_ratio': eng.get('upvote_ratio', 0),
            },
            'content_snippet': '; '.join(
                c.get('excerpt', '')[:100]
                for c in (item.get('top_comments') or [])[:3]
            ),
            'pre_score': item.get('score', 0),
        })

    # Process web results (may include TikTok, articles)
    for item in (data.get('web') or []):
        eng = item.get('engagement') or {}
        url = item.get('url', '')
        platform = 'tiktok' if 'tiktok.com' in url else 'web'
        candidates.append({
            'source_platform': platform,
            'category_hint': category,
            'title': item.get('title', ''),
            'url': url,
            'channel_or_author': item.get('source', item.get('channel_name', '')),
            'date': item.get('date', ''),
            'engagement': eng,
            'content_snippet': item.get('snippet', item.get('transcript_snippet', '')),
            'pre_score': item.get('score', 0),
        })

# Deduplicate by URL
seen_urls = set()
unique = []
for c in candidates:
    url = c['url']
    if url and url not in seen_urls:
        seen_urls.add(url)
        unique.append(c)

# Sort by pre_score descending
unique.sort(key=lambda x: x.get('pre_score', 0), reverse=True)

output = {
    'search_timestamp': datetime.now(timezone.utc).isoformat(),
    'categories_searched': categories_searched,
    'candidates': unique,
}

with open('$OUTPUT_FILE', 'w') as f:
    json.dump(output, f, indent=2)

print(f'[RESULT] {len(unique)} unique candidates from {len(categories_searched)} categories')
"

CANDIDATE_COUNT=$(python3 -c "import json; print(len(json.load(open('$OUTPUT_FILE')).get('candidates',[])))")
echo "[$(date)] Output: $OUTPUT_FILE ($CANDIDATE_COUNT candidates)"

# ── Cleanup per-category files ───────────────────────────────────────
rm -f "$SEARCH_DIR"/search-*.json
rmdir "$SEARCH_DIR" 2>/dev/null || true
