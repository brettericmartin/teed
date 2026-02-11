// ============================================================================
// Survey Question Options — shared between ApplyForm and OnboardingSurvey
// ============================================================================

export const CREATOR_TYPES = [
  { id: 'professional_creator', label: 'Professional Creator', icon: '🎬', description: 'Content creation is my career' },
  { id: 'serious_hobbyist', label: 'Serious Hobbyist', icon: '🎯', description: 'I create content consistently as a passion' },
  { id: 'brand_ambassador', label: 'Brand Ambassador', icon: '🤝', description: 'I work with brands and do sponsorships' },
  { id: 'building_audience', label: 'Building My Audience', icon: '📈', description: 'Actively growing, not yet established' },
  { id: 'purely_casual', label: 'Purely Casual', icon: '🏡', description: 'I just share what I love with friends' },
];

export const NICHES = [
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'tech_gadgets', label: 'Tech & Gadgets', icon: '📱' },
  { id: 'fashion', label: 'Fashion & Style', icon: '👔' },
  { id: 'outdoor_adventure', label: 'Outdoor & Adventure', icon: '🏔️' },
  { id: 'home_office', label: 'Home & Office', icon: '🏠' },
  { id: 'fitness', label: 'Fitness & Wellness', icon: '💪' },
  { id: 'other', label: 'Something Else', icon: '✨' },
];

export const AUDIENCE_SIZES = [
  { id: 'friends_family', label: 'Just Friends & Family', description: 'Sharing with people I know' },
  { id: 'under_1k', label: 'Under 1,000', description: 'Just getting started' },
  { id: '1k_10k', label: '1,000 - 10,000', description: 'Growing steadily' },
  { id: '10k_50k', label: '10,000 - 50,000', description: 'Established creator' },
  { id: '50k_plus', label: '50,000+', description: 'Significant reach' },
];

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', icon: '🎥' },
  { id: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { id: 'blog', label: 'Blog / Website', icon: '✍️' },
  { id: 'other', label: 'Other', icon: '🌐' },
];

export const AFFILIATE_STATUS = [
  { id: 'actively', label: 'Yes, actively', description: 'I earn from affiliates regularly' },
  { id: 'sometimes', label: 'Sometimes', description: 'I use them occasionally' },
  { id: 'want_to_start', label: 'Want to start', description: "Haven't figured it out yet" },
  { id: 'not_interested', label: 'Not really', description: 'Not my focus right now' },
];

export const REVENUE_GOALS = [
  { id: 'side_income', label: '$100-500/month', description: 'Nice side income' },
  { id: 'meaningful_income', label: '$500-2,000/month', description: 'Meaningful revenue' },
  { id: 'significant_income', label: '$2,000+/month', description: 'Significant income stream' },
  { id: 'not_priority', label: "Money isn't the goal", description: 'I just want to share' },
];

export const CURRENT_TOOLS = [
  { id: 'linktree', label: 'Linktree' },
  { id: 'amazon_storefront', label: 'Amazon Storefront' },
  { id: 'ltk', label: 'LTK (Like to Know)' },
  { id: 'notion', label: 'Notion / Docs' },
  { id: 'instagram_guides', label: 'Instagram Guides' },
  { id: 'nothing', label: 'Nothing yet' },
  { id: 'other', label: 'Something else' },
];

export const FRUSTRATIONS = [
  { id: 'time_consuming', label: 'Too time-consuming', description: 'Creating lists takes forever' },
  { id: 'looks_bad', label: "Doesn't look good", description: 'Current tools are ugly' },
  { id: 'no_analytics', label: 'No good analytics', description: "I don't know what works" },
  { id: 'affiliate_complexity', label: 'Affiliate links are complicated', description: 'Hard to set up and manage' },
  { id: 'repeated_questions', label: 'Audience keeps asking', description: 'Same questions over and over' },
];

export const USAGE_INTENT = [
  { id: 'immediately', label: 'Within 24 hours', description: "I'm ready to go" },
  { id: 'this_week', label: 'This week', description: 'Soon, just need to gather items' },
  { id: 'explore_first', label: "I'd explore first", description: "Want to see what's possible" },
  { id: 'not_sure', label: 'Not sure', description: 'Depends on the experience' },
];

export const DOCUMENTATION_HABITS = [
  { id: 'detailed_notes', label: 'I keep detailed notes', description: 'About why I chose each product' },
  { id: 'basic_tracking', label: 'Basic tracking', description: 'I know what I have, roughly' },
  { id: 'scattered_info', label: 'Info is scattered', description: 'Across apps, notes, bookmarks' },
  { id: 'nothing_organized', label: 'Nothing organized', description: 'I just remember or search again' },
];
