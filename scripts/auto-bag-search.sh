#!/usr/bin/env bash
set -euo pipefail

# Auto-Bag Search: Pre-search phase
# Directly queries Reddit JSON API (free, date-filtered) and YouTube via yt-dlp.
# Rotates through 5 of 10 categories per run (date-seeded).
# Outputs merged candidates to /tmp/teed-auto-bag-candidates.json
#
# Cost: $0 (no API keys needed — Reddit JSON + yt-dlp are free)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="/tmp/teed-auto-bag-candidates.json"
SEARCH_DIR="/tmp/teed-search-results"

mkdir -p "$SEARCH_DIR"

ALL_CATEGORIES=(edc tech golf fitness cooking fashion photography outdoor gaming travel)

# ── Date-seeded category rotation: 5 of 10 per run ──────────────────

DAY_OF_YEAR=$(date +%j)
OFFSET=$((DAY_OF_YEAR % 10))
SELECTED=()
for i in 0 1 2 3 4; do
  IDX=$(( (OFFSET + i * 2) % 10 ))
  SELECTED+=("${ALL_CATEGORIES[$IDX]}")
done

echo "[$(date)] Auto-bag search starting"
echo "[$(date)] Categories this run: ${SELECTED[*]}"

# ── Search config ────────────────────────────────────────────────────
# Each category maps to:
#   - Reddit subreddits + search terms (sorted by hot, filtered to last day)
#   - YouTube search queries (filtered by upload date)
#
# These target community-generated product lists: pocket dumps, setups,
# WITBs, hauls — the kind of content posted daily by regular people.

DATEAFTER=$(date -d "yesterday" +%Y%m%d)

search_reddit_sub() {
  local sub="$1" query="$2" outfile="$3"
  # Reddit JSON API: sort=new, t=day (last 24h), limit=15
  local url="https://www.reddit.com/r/${sub}/search/.json?q=${query}&restrict_sr=on&sort=new&t=day&limit=15&raw_json=1"
  curl -sS -H "User-Agent: teed-auto-bag/1.0" "$url" 2>/dev/null \
    | python3 -c "
import json, sys
from datetime import datetime, timezone
try:
    data = json.load(sys.stdin)
except:
    json.dump([], sys.stdout); sys.exit(0)
children = data.get('data', {}).get('children', [])
items = []
for c in children:
    if c.get('kind') != 't3':
        continue
    p = c.get('data', {})
    permalink = p.get('permalink', '')
    if not permalink:
        continue
    created = p.get('created_utc', 0)
    date_str = datetime.fromtimestamp(created, tz=timezone.utc).strftime('%Y-%m-%d') if created else ''
    score = p.get('score', 0)
    num_comments = p.get('num_comments', 0)
    # Skip very low engagement (likely spam)
    if score < 2 and num_comments < 1:
        continue
    items.append({
        'title': str(p.get('title', '')).strip(),
        'url': 'https://www.reddit.com' + permalink,
        'subreddit': str(p.get('subreddit', '$sub')).strip(),
        'date': date_str,
        'score': score,
        'num_comments': num_comments,
        'upvote_ratio': p.get('upvote_ratio', 0),
        'selftext_snippet': str(p.get('selftext', ''))[:300],
        'has_image': p.get('post_hint', '') in ('image', 'link') or bool(p.get('gallery_data')),
    })
json.dump(items, sys.stdout)
" >> "$outfile"
}

search_youtube_category() {
  local query="$1" outfile="$2" count="${3:-10}"
  # yt-dlp search with --dateafter to only get recent uploads
  yt-dlp "ytsearch${count}:${query}" \
    --dump-json \
    --no-warnings \
    --no-download \
    --dateafter "$DATEAFTER" \
    2>/dev/null \
    | python3 -c "
import json, sys
items = []
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        v = json.loads(line)
    except:
        continue
    vid = v.get('id', '')
    upload = v.get('upload_date', '')
    date_str = ''
    if upload and len(upload) == 8:
        date_str = f'{upload[:4]}-{upload[4:6]}-{upload[6:8]}'
    items.append({
        'video_id': vid,
        'title': v.get('title', ''),
        'url': f'https://www.youtube.com/watch?v={vid}',
        'channel_name': v.get('channel', v.get('uploader', '')),
        'date': date_str,
        'views': v.get('view_count', 0) or 0,
        'likes': v.get('like_count', 0) or 0,
        'comments': v.get('comment_count', 0) or 0,
        'duration': v.get('duration', 0),
        'description_snippet': str(v.get('description', ''))[:500],
    })
json.dump(items, sys.stdout)
" >> "$outfile"
}

# ── Run searches per category ────────────────────────────────────────

run_category() {
  local category="$1"
  local reddit_file="$SEARCH_DIR/reddit-${category}.json"
  local yt_file="$SEARCH_DIR/youtube-${category}.json"
  echo -n "[" > "$reddit_file"
  echo -n "[" > "$yt_file"

  echo "[$(date)] Searching: $category" >&2

  case "$category" in
    edc)
      search_reddit_sub "EDC" "pocket+dump+OR+carry+OR+edc" "$reddit_file"
      search_reddit_sub "flashlight" "my+light+OR+collection+OR+NLD" "$reddit_file"
      search_reddit_sub "knifeclub" "my+knife+OR+NKD+OR+collection" "$reddit_file"
      search_youtube_category "EDC pocket dump 2026" "$yt_file"
      search_youtube_category "everyday carry what I carry" "$yt_file"
      ;;
    tech)
      search_reddit_sub "battlestations" "setup+OR+battlestation+OR+desk" "$reddit_file"
      search_reddit_sub "MechanicalKeyboards" "my+keyboard+OR+build+OR+setup" "$reddit_file"
      search_reddit_sub "homelab" "my+setup+OR+homelab+OR+rack" "$reddit_file"
      search_youtube_category "desk setup tour 2026" "$yt_file"
      search_youtube_category "tech haul unboxing" "$yt_file"
      ;;
    golf)
      search_reddit_sub "golf" "WITB+OR+new+clubs+OR+my+bag" "$reddit_file"
      search_reddit_sub "golfclassifieds" "WITB+OR+selling+OR+bag" "$reddit_file"
      search_youtube_category "golf WITB what's in the bag 2026" "$yt_file"
      search_youtube_category "golf club haul new clubs" "$yt_file"
      ;;
    fitness)
      search_reddit_sub "homegym" "my+gym+OR+setup+OR+home+gym" "$reddit_file"
      search_reddit_sub "GYM" "gym+bag+OR+essentials+OR+gear" "$reddit_file"
      search_reddit_sub "running" "gear+OR+shoes+OR+my+setup" "$reddit_file"
      search_youtube_category "gym bag essentials haul" "$yt_file"
      search_youtube_category "home gym setup tour" "$yt_file"
      ;;
    cooking)
      search_reddit_sub "Cooking" "kitchen+haul+OR+gadgets+OR+my+kitchen" "$reddit_file"
      search_reddit_sub "KitchenConfidential" "my+knives+OR+my+kitchen+OR+setup" "$reddit_file"
      search_reddit_sub "chefknives" "my+knife+OR+collection+OR+NKD" "$reddit_file"
      search_youtube_category "kitchen gadgets haul" "$yt_file"
      search_youtube_category "kitchen essentials must have" "$yt_file"
      ;;
    fashion)
      search_reddit_sub "malefashionadvice" "haul+OR+pickup+OR+my+outfit+OR+wardrobe" "$reddit_file"
      search_reddit_sub "femalefashionadvice" "haul+OR+pickup+OR+my+outfit+OR+wardrobe" "$reddit_file"
      search_reddit_sub "streetwear" "pickup+OR+haul+OR+fit+OR+my+collection" "$reddit_file"
      search_youtube_category "fashion haul try on" "$yt_file"
      search_youtube_category "wardrobe essentials capsule" "$yt_file"
      ;;
    photography)
      search_reddit_sub "photography" "my+gear+OR+camera+bag+OR+kit+OR+setup" "$reddit_file"
      search_reddit_sub "videography" "my+gear+OR+rig+OR+setup+OR+kit" "$reddit_file"
      search_reddit_sub "cameras" "my+camera+OR+new+camera+OR+gear" "$reddit_file"
      search_youtube_category "camera gear bag tour what's in my bag" "$yt_file"
      search_youtube_category "photography kit essentials" "$yt_file"
      ;;
    outdoor)
      search_reddit_sub "CampingGear" "my+gear+OR+gear+list+OR+setup" "$reddit_file"
      search_reddit_sub "ultralight" "gear+list+OR+lighterpack+OR+my+kit" "$reddit_file"
      search_reddit_sub "hiking" "gear+OR+my+pack+OR+essentials" "$reddit_file"
      search_youtube_category "camping gear haul essentials" "$yt_file"
      search_youtube_category "hiking gear list backpacking" "$yt_file"
      ;;
    gaming)
      search_reddit_sub "battlestations" "gaming+setup+OR+gaming+desk+OR+my+setup" "$reddit_file"
      search_reddit_sub "GamingSetups" "setup+OR+my+setup+OR+tour" "$reddit_file"
      search_reddit_sub "pcmasterrace" "setup+OR+build+OR+my+pc+OR+battlestation" "$reddit_file"
      search_youtube_category "gaming setup tour desk" "$yt_file"
      search_youtube_category "gaming gear haul accessories" "$yt_file"
      ;;
    travel)
      search_reddit_sub "onebag" "packing+list+OR+my+bag+OR+travel+gear" "$reddit_file"
      search_reddit_sub "HerOneBag" "packing+list+OR+my+bag+OR+travel" "$reddit_file"
      search_reddit_sub "travel" "packing+OR+essentials+OR+gear+OR+must+have" "$reddit_file"
      search_youtube_category "travel packing list essentials" "$yt_file"
      search_youtube_category "what's in my travel bag" "$yt_file"
      ;;
  esac

  # Close JSON arrays (search_reddit_sub appends JSON arrays, need to merge)
  # The files have concatenated JSON arrays — merge them
  python3 -c "
import json, sys
# reddit file has concatenated JSON arrays
with open('$reddit_file') as f:
    text = f.read()
# Remove the leading '[' we wrote, parse concatenated arrays
text = text[1:]  # remove first [
items = []
for chunk in text.split(']['):
    chunk = chunk.strip().strip('[]')
    if not chunk:
        continue
    try:
        items.extend(json.loads('[' + chunk + ']'))
    except:
        pass
with open('$reddit_file', 'w') as f:
    json.dump(items, f)
" 2>/dev/null || echo '[]' > "$reddit_file"

  python3 -c "
import json, sys
with open('$yt_file') as f:
    text = f.read()
text = text[1:]
items = []
for chunk in text.split(']['):
    chunk = chunk.strip().strip('[]')
    if not chunk:
        continue
    try:
        items.extend(json.loads('[' + chunk + ']'))
    except:
        pass
with open('$yt_file', 'w') as f:
    json.dump(items, f)
" 2>/dev/null || echo '[]' > "$yt_file"

  echo "[$(date)] Done: $category" >&2
}

# Run all categories in parallel
PIDS=()
for category in "${SELECTED[@]}"; do
  run_category "$category" &
  PIDS+=($!)
done

for pid in "${PIDS[@]}"; do
  wait "$pid" 2>/dev/null || true
done

echo "[$(date)] All searches complete. Merging results..."

# ── Merge and normalize results ──────────────────────────────────────

python3 -c "
import json, sys, os
from datetime import datetime, timedelta, timezone

candidates = []
categories_searched = []
search_dir = '$SEARCH_DIR'

cutoff = (datetime.now(timezone.utc) - timedelta(hours=36)).strftime('%Y-%m-%d')

for category in '${SELECTED[*]}'.split():
    categories_searched.append(category)

    # Process Reddit results
    reddit_file = os.path.join(search_dir, f'reddit-{category}.json')
    if os.path.exists(reddit_file):
        try:
            with open(reddit_file) as f:
                items = json.load(f)
            for item in items:
                date = item.get('date', '')
                if not date or date < cutoff:
                    continue
                candidates.append({
                    'source_platform': 'reddit',
                    'category_hint': category,
                    'title': item.get('title', ''),
                    'url': item.get('url', ''),
                    'channel_or_author': 'r/' + item.get('subreddit', ''),
                    'date': date,
                    'engagement': {
                        'score': item.get('score', 0),
                        'comments': item.get('num_comments', 0),
                        'upvote_ratio': item.get('upvote_ratio', 0),
                    },
                    'content_snippet': item.get('selftext_snippet', ''),
                    'has_image': item.get('has_image', False),
                    'pre_score': item.get('score', 0),
                })
        except (json.JSONDecodeError, IOError):
            pass

    # Process YouTube results
    yt_file = os.path.join(search_dir, f'youtube-{category}.json')
    if os.path.exists(yt_file):
        try:
            with open(yt_file) as f:
                items = json.load(f)
            for item in items:
                date = item.get('date', '')
                if not date or date < cutoff:
                    continue
                candidates.append({
                    'source_platform': 'youtube',
                    'category_hint': category,
                    'title': item.get('title', ''),
                    'url': item.get('url', ''),
                    'channel_or_author': item.get('channel_name', ''),
                    'date': date,
                    'engagement': {
                        'views': item.get('views', 0),
                        'likes': item.get('likes', 0),
                        'comments': item.get('comments', 0),
                    },
                    'content_snippet': item.get('description_snippet', ''),
                    'pre_score': item.get('views', 0),
                })
        except (json.JSONDecodeError, IOError):
            pass

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

# Stats
reddit_count = sum(1 for c in unique if c['source_platform'] == 'reddit')
yt_count = sum(1 for c in unique if c['source_platform'] == 'youtube')
print(f'[RESULT] {len(unique)} unique candidates ({reddit_count} reddit, {yt_count} youtube) from {len(categories_searched)} categories')
"

CANDIDATE_COUNT=$(python3 -c "import json; print(len(json.load(open('$OUTPUT_FILE')).get('candidates',[])))")
echo "[$(date)] Output: $OUTPUT_FILE ($CANDIDATE_COUNT candidates)"

# ── Cleanup per-category files ───────────────────────────────────────
rm -f "$SEARCH_DIR"/reddit-*.json "$SEARCH_DIR"/youtube-*.json
rmdir "$SEARCH_DIR" 2>/dev/null || true
