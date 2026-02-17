import { CURATION_KEYWORDS, GOOD_FLAIRS } from '@/lib/types/risingPosts';

// ═══════════════════════════════════════════════════════════════════
// Reddit Post Scoring
// ═══════════════════════════════════════════════════════════════════

interface RedditPostData {
  title: string;
  selftext: string;
  linkFlairText: string;
  score: number;
  numComments: number;
  ageHours: number;
  isImage: boolean;
}

/**
 * Score a Reddit post for curation-engagement potential.
 * Higher scores = better opportunity for Teed engagement.
 */
export function scoreRedditPost(post: RedditPostData): {
  teedScore: number;
  keywordHits: number;
} {
  const title = post.title.toLowerCase();
  const selftext = post.selftext.toLowerCase();
  const flair = post.linkFlairText.toLowerCase();

  // Base engagement score
  const engagement = post.score + post.numComments * 3;

  // Freshness bonus: newer posts are more valuable to comment on
  let freshness = 0;
  if (post.ageHours < 1) freshness = 50;
  else if (post.ageHours < 3) freshness = 30;
  else if (post.ageHours < 6) freshness = 15;
  else if (post.ageHours < 12) freshness = 5;

  // Curation keyword bonus
  let keywordHits = 0;
  const text = `${title} ${selftext} ${flair}`;
  for (const kw of CURATION_KEYWORDS) {
    if (text.includes(kw)) {
      keywordHits++;
    }
  }

  // Flair bonus
  const flairBonus = GOOD_FLAIRS.some((f) => flair.includes(f)) ? 20 : 0;

  // Image posts are more engaging (setup photos, flat lays)
  const imageBonus = post.isImage ? 15 : 0;

  // Early comment opportunity: posts with few comments but rising score
  let earlyBonus = 0;
  if (post.score > 10 && post.numComments < 10) {
    earlyBonus = 25;
  } else if (post.score > 50 && post.numComments < 20) {
    earlyBonus = 15;
  }

  const teedScore =
    engagement + freshness + keywordHits * 10 + flairBonus + imageBonus + earlyBonus;

  return { teedScore, keywordHits };
}

// ═══════════════════════════════════════════════════════════════════
// YouTube Video Scoring
// ═══════════════════════════════════════════════════════════════════

interface YouTubeVideoData {
  title: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  ageHours: number;
}

/**
 * Score a YouTube video for curation-engagement potential.
 */
export function scoreYouTubeVideo(video: YouTubeVideoData): {
  teedScore: number;
  keywordHits: number;
} {
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase().slice(0, 500);

  // View velocity — views per hour, capped at 500
  const viewVelocity = video.ageHours > 0
    ? Math.min(video.views / video.ageHours, 500)
    : 0;

  // Engagement
  const engagement = video.comments * 2 + video.likes * 0.5;

  // Freshness bonus (same scale as Reddit)
  let freshness = 0;
  if (video.ageHours < 1) freshness = 50;
  else if (video.ageHours < 3) freshness = 30;
  else if (video.ageHours < 6) freshness = 15;
  else if (video.ageHours < 12) freshness = 5;

  // Keyword hits
  let keywordHits = 0;
  const text = `${title} ${description}`;
  for (const kw of CURATION_KEYWORDS) {
    if (text.includes(kw)) {
      keywordHits++;
    }
  }

  // Content type match bonus (setup/gear video titles)
  const contentPatterns = [
    /setup tour/i, /what's in/i, /whats in/i, /gear review/i,
    /my .* setup/i, /desk tour/i, /bag check/i, /haul/i,
    /everyday carry/i, /edc/i, /witb/i,
  ];
  const contentBonus = contentPatterns.some((p) => p.test(video.title)) ? 20 : 0;

  const teedScore =
    viewVelocity + engagement + freshness + keywordHits * 10 + contentBonus;

  return { teedScore: Math.round(teedScore), keywordHits };
}
