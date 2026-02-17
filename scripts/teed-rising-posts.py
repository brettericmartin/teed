#!/usr/bin/env python3
"""
Teed Rising Posts Finder
Fetches rising/new posts from product-curation subreddits and scores them
by engagement potential for Teed.

Usage:
  python3 scripts/teed-rising-posts.py              # all categories
  python3 scripts/teed-rising-posts.py --cat golf    # just golf
  python3 scripts/teed-rising-posts.py --cat tech    # just tech/desk
  python3 scripts/teed-rising-posts.py --cat beauty  # just beauty
  python3 scripts/teed-rising-posts.py --cat edc     # just EDC/bags
  python3 scripts/teed-rising-posts.py --cat travel  # just travel
  python3 scripts/teed-rising-posts.py --top 5       # top 5 only
"""

import json
import sys
import time
import argparse
import urllib.request
from datetime import datetime, timezone

# ── Subreddit Config ─────────────────────────────────────────────────────────

SUBREDDITS = {
    "golf": [
        {"sub": "golf", "label": "r/golf"},
        {"sub": "golfequipment", "label": "r/golfequipment"},
    ],
    "tech": [
        {"sub": "battlestations", "label": "r/battlestations"},
        {"sub": "desksetup", "label": "r/desksetup"},
        {"sub": "MechanicalKeyboards", "label": "r/MechanicalKeyboards"},
        {"sub": "audiophile", "label": "r/audiophile"},
    ],
    "beauty": [
        {"sub": "Sephora", "label": "r/Sephora"},
        {"sub": "MakeupAddiction", "label": "r/MakeupAddiction"},
        {"sub": "SkincareAddiction", "label": "r/SkincareAddiction"},
    ],
    "edc": [
        {"sub": "EDC", "label": "r/EDC"},
        {"sub": "handbags", "label": "r/handbags"},
        {"sub": "BuyItForLife", "label": "r/BuyItForLife"},
    ],
    "travel": [
        {"sub": "onebag", "label": "r/onebag"},
        {"sub": "HerOneBag", "label": "r/HerOneBag"},
    ],
}

# Keywords that signal product-curation content (higher = better for Teed)
CURATION_KEYWORDS = [
    "setup", "carry", "haul", "bag", "collection", "rotation", "dump",
    "packing", "bought", "recommendation", "routine", "kit", "gear",
    "essentials", "favorite", "favourites", "review", "witb", "what's in",
    "whats in", "products", "list", "peripherals", "gadgets", "edc",
    "flatlay", "flat lay", "daily", "travel", "loadout", "inventory",
    "my .* setup", "starter", "upgrade", "new to", "first time",
    "rate my", "roast my", "show me yours",
]

# Flairs that are highly relevant
GOOD_FLAIRS = [
    "rotation", "bag", "pocket dump", "packing list", "haul", "fotd",
    "so i bought", "gear", "work edc", "battlestations",
    "seeking recommendations", "question", "advice",
]


def fetch_subreddit(sub: str, sort: str = "rising", limit: int = 15) -> list:
    """Fetch posts from a subreddit's rising/new/hot feed."""
    url = f"https://www.reddit.com/r/{sub}/{sort}.json?limit={limit}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; TeedRising/1.0)"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        return data.get("data", {}).get("children", [])
    except Exception as e:
        print(f"  ⚠ Failed to fetch r/{sub}/{sort}: {e}", file=sys.stderr)
        return []


def score_post(post: dict) -> dict:
    """Score a post for curation-engagement potential."""
    d = post["data"]
    title = (d.get("title") or "").lower()
    selftext = (d.get("selftext") or "").lower()
    flair = (d.get("link_flair_text") or "").lower()
    score = d.get("score", 0)
    comments = d.get("num_comments", 0)
    created = d.get("created_utc", 0)
    age_hours = (time.time() - created) / 3600 if created else 999

    # Base engagement score (log scale, weighted toward rising posts)
    engagement = score + (comments * 3)

    # Freshness bonus: newer posts are more valuable to comment on
    if age_hours < 1:
        freshness = 50
    elif age_hours < 3:
        freshness = 30
    elif age_hours < 6:
        freshness = 15
    elif age_hours < 12:
        freshness = 5
    else:
        freshness = 0

    # Curation keyword bonus
    keyword_hits = 0
    text = f"{title} {selftext} {flair}"
    for kw in CURATION_KEYWORDS:
        if kw in text:
            keyword_hits += 1

    # Flair bonus
    flair_bonus = 20 if any(f in flair for f in GOOD_FLAIRS) else 0

    # Image posts are more engaging (setup photos, flat lays)
    is_image = d.get("post_hint") == "image" or d.get("is_gallery", False)
    image_bonus = 15 if is_image else 0

    # Comment opportunity: posts with few comments but rising score
    if score > 10 and comments < 10:
        early_bonus = 25
    elif score > 50 and comments < 20:
        early_bonus = 15
    else:
        early_bonus = 0

    total = engagement + freshness + (keyword_hits * 10) + flair_bonus + image_bonus + early_bonus

    return {
        "title": d.get("title", ""),
        "url": f"https://reddit.com{d.get('permalink', '')}",
        "subreddit": d.get("subreddit", ""),
        "flair": d.get("link_flair_text") or "",
        "score": score,
        "comments": comments,
        "age_hours": round(age_hours, 1),
        "is_image": is_image,
        "keyword_hits": keyword_hits,
        "teed_score": total,
        "created_utc": created,
    }


def main():
    parser = argparse.ArgumentParser(description="Find rising product-curation posts for Teed engagement")
    parser.add_argument("--cat", choices=list(SUBREDDITS.keys()), help="Category filter")
    parser.add_argument("--top", type=int, default=15, help="Show top N posts (default: 15)")
    parser.add_argument("--sort", choices=["rising", "new", "hot"], default="rising", help="Reddit sort (default: rising)")
    args = parser.parse_args()

    # Select subreddits
    if args.cat:
        subs = SUBREDDITS[args.cat]
        print(f"\n🎯 Fetching {args.sort} posts from {args.cat} subreddits...\n")
    else:
        subs = [s for cat_subs in SUBREDDITS.values() for s in cat_subs]
        print(f"\n🎯 Fetching {args.sort} posts from ALL categories...\n")

    # Fetch all posts
    all_posts = []
    for sub_info in subs:
        posts = fetch_subreddit(sub_info["sub"], sort=args.sort)
        for p in posts:
            scored = score_post(p)
            scored["category_label"] = sub_info["label"]
            all_posts.append(scored)
        # Rate limit: Reddit allows ~60 req/min for unauthenticated
        time.sleep(0.5)

    # Sort by teed_score descending
    all_posts.sort(key=lambda x: x["teed_score"], reverse=True)

    # Display top N
    top = all_posts[:args.top]
    if not top:
        print("No posts found. Try --sort hot or different --cat\n")
        return

    now = datetime.now(timezone.utc)
    print(f"📊 Top {len(top)} posts to engage with (as of {now.strftime('%H:%M UTC')}):\n")
    print("─" * 80)

    for i, post in enumerate(top, 1):
        age_str = f"{post['age_hours']}h ago" if post['age_hours'] < 24 else f"{post['age_hours']/24:.0f}d ago"
        img = "📷" if post["is_image"] else "📝"
        flair_str = f" [{post['flair']}]" if post['flair'] else ""

        print(f"\n  #{i}  {img}  {post['category_label']}{flair_str}")
        print(f"      {post['title']}")
        print(f"      ⬆ {post['score']}  💬 {post['comments']}  🕐 {age_str}  ⚡ teed:{post['teed_score']}")
        print(f"      {post['url']}")

    print(f"\n{'─' * 80}")
    print(f"\n💡 Engagement tips:")
    print(f"   • Posts with ⚡ teed:100+ are highest priority")
    print(f"   • 📷 = image/gallery post (setup photos, flat lays)")
    print(f"   • Target posts < 3h old with < 20 comments for best visibility")
    print(f"   • Ask about specific products: \"What monitor arm is that?\" > \"Nice setup!\"")
    print(f"\n   Run again: python3 scripts/teed-rising-posts.py")
    print(f"   Filter:    python3 scripts/teed-rising-posts.py --cat golf --top 5\n")


if __name__ == "__main__":
    main()
