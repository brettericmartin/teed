/**
 * Beta System Type Definitions
 *
 * Types for the waitlist, closed beta, and capacity management system.
 */

// ============================================================================
// Capacity Types
// ============================================================================

export interface BetaCapacity {
  total: number;
  used: number;
  available: number;
  reserved_for_codes: number;
  effective_capacity: number;
  pending_applications: number;
  approved_this_week: number;
  is_at_capacity: boolean;
  percent_full: number;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface BetaCapacitySettings {
  total: number;
  reserved_for_codes: number;
}

export type BetaPhase = 'founding' | 'limited' | 'open';

export interface BetaSettings {
  beta_capacity: BetaCapacitySettings;
  auto_approval_enabled: boolean;
  auto_approval_priority_threshold: number;
  beta_phase: BetaPhase;
  waitlist_message: string;
}

export interface BetaSettingsRecord {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Application Types
// ============================================================================

export type ApplicationStatus = 'pending' | 'approved' | 'waitlisted' | 'rejected';

export interface SurveyResponses {
  // Creator Profile (4 questions)
  creator_type?: 'professional_creator' | 'serious_hobbyist' | 'brand_ambassador' | 'building_audience' | 'purely_casual';
  primary_niche?: 'golf' | 'tech_gadgets' | 'fashion' | 'outdoor_adventure' | 'home_office' | 'fitness' | 'other';
  primary_niche_other?: string;
  audience_size?: 'friends_family' | 'under_1k' | '1k_10k' | '10k_50k' | '50k_plus';
  primary_platform?: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'blog' | 'other';

  // Monetization Intent (3 questions)
  affiliate_status?: 'actively' | 'sometimes' | 'want_to_start' | 'not_interested';
  revenue_goals?: 'side_income' | 'meaningful_income' | 'significant_income' | 'not_priority';
  current_tools?: string[]; // ['linktree', 'amazon_storefront', 'ltk', 'notion', 'instagram_guides', 'nothing', 'other']

  // Pain Points (3 questions) - biggest_frustrations is now an array for multi-select
  biggest_frustrations?: string[];  // ['time_consuming', 'looks_bad', 'no_analytics', 'affiliate_complexity', 'repeated_questions']
  biggest_frustration?: string;  // Legacy single field for backward compatibility
  magic_wand_feature?: string;
  usage_intent?: 'immediately' | 'this_week' | 'explore_first' | 'not_sure';

  // Documentation (new for scorecard)
  documentation_habits?: 'detailed_notes' | 'basic_tracking' | 'scattered_info' | 'nothing_organized';

  // Legacy fields (from old survey)
  use_case?: string;
  experience_level?: string;
  excitement?: string;
  referral_source?: string;
}

export interface BetaApplication {
  id: string;
  email: string;
  name?: string;
  full_name?: string;

  // Segmentation
  social_platform: string | null;
  social_handle: string | null;
  follower_range: string | null;
  primary_use_case: string;
  content_frequency: string | null;
  monetization_interest: boolean;

  // Open responses
  biggest_challenge: string | null;
  how_heard: string | null;
  referred_by_code: string | null;

  // New survey data
  survey_responses: SurveyResponses;
  use_case?: string;
  source: string;

  // Admin fields
  status: ApplicationStatus;
  priority_score: number;
  admin_notes: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  waitlist_position: number | null;

  // Timestamps
  created_at: string;
  reviewed_at: string | null;
  invited_at: string | null;
}

// ============================================================================
// Invite Code Types
// ============================================================================

export type BetaTier = 'founder' | 'influencer' | 'standard' | 'friend';

export interface BetaInviteCode {
  id: string;
  code: string;
  created_by_id: string | null;
  application_id: string | null;
  tier: BetaTier;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
  first_claimed_at: string | null;
  notes: string | null;

  // Enhanced fields
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  campaign: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
}

export interface CodeClaimResult {
  valid: boolean;
  error?: string;
  code_id?: string;
  tier?: BetaTier;
  created_by_id?: string;
  campaign?: string;
  remaining_uses?: number;
}

export type CodeUsageResult = 'success' | 'expired' | 'max_uses' | 'revoked' | 'invalid' | 'error';

export interface BetaCodeUsage {
  id: string;
  code_id: string | null;
  code: string;
  user_id: string | null;
  user_email: string | null;
  application_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  result: CodeUsageResult;
  error_message: string | null;
  created_at: string;
}

// ============================================================================
// Admin Dashboard Types
// ============================================================================

export interface BetaDashboardStats {
  capacity: BetaCapacity;
  applications: {
    total: number;
    pending: number;
    approved: number;
    waitlisted: number;
    rejected: number;
  };
  codes: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
    total_uses: number;
  };
  funnel: {
    visitors: number;
    survey_starts: number;
    survey_completions: number;
    approved: number;
  };
}

export interface ApplicationFilters {
  status?: ApplicationStatus | 'all';
  search?: string;
  sort_by?: 'waitlist_position' | 'priority_score' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CodeFilters {
  status?: 'active' | 'expired' | 'revoked' | 'all';
  tier?: BetaTier | 'all';
  campaign?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApproveApplicationResult {
  success: boolean;
  error?: string;
  invite_code?: string;
  code_id?: string;
  tier?: BetaTier;
  applicant_email?: string;
}

export interface BatchApproveResult {
  success: boolean;
  error?: string;
  requested: number;
  available_slots: number;
  approved_count: number;
  results: ApproveApplicationResult[];
}

export interface GenerateCodeRequest {
  tier: BetaTier;
  max_uses: number;
  expires_at?: string;
  notes?: string;
  campaign?: string;
  count?: number; // Generate multiple codes at once
}

// ============================================================================
// Audit Action Types (extend from admin.ts)
// ============================================================================

export type BetaAuditAction =
  | 'beta.capacity_changed'
  | 'beta.auto_approve_toggled'
  | 'beta.application_approved'
  | 'beta.application_rejected'
  | 'beta.application_waitlisted'
  | 'beta.bulk_approved'
  | 'beta.code_created'
  | 'beta.code_revoked'
  | 'beta.users_migrated';

// ============================================================================
// Component Props Types
// ============================================================================

export interface BetaCapacityCounterProps {
  className?: string;
  showDetails?: boolean;
  refreshInterval?: number; // ms, default 30000
}

export interface BetaStatusBadgeProps {
  status: 'pending' | 'approved' | 'waitlist' | 'none';
  tier?: BetaTier;
  position?: number;
  className?: string;
}

export interface ApplicationRowProps {
  application: BetaApplication;
  onApprove: (id: string, tier: BetaTier) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onWaitlist: (id: string) => Promise<void>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// ============================================================================
// Referral Tier Types
// ============================================================================

export interface ReferralTierInfo {
  tier: number;
  name: 'Standard' | 'Engaged' | 'Connector' | 'Champion' | 'Legend';
  badge_color: 'gray' | 'green' | 'blue' | 'purple' | 'gold';
  benefits: string[];
}

export interface ReferralStats {
  application_id: string;
  successful_referrals: number;
  current_tier: ReferralTierInfo;
  next_tier: ReferralTierInfo | null;
  referrals_until_next_tier: number;
  referrals_until_instant_approval: number;
  has_instant_approval: boolean;
  referral_link: string;
}

export interface ApprovalPathSuggestion {
  action: string;
  impact: string;
  priority: number;
  icon: string;
}

export interface ApplicationStats extends ReferralStats {
  approval_odds: number;
  priority_score: number;
  status: ApplicationStatus;
  waitlist_position: number | null;
  approval_path: ApprovalPathSuggestion[];
}

// ============================================================================
// Deadline Types
// ============================================================================

export interface BetaDeadline {
  has_deadline: boolean;
  deadline?: string;
  days_remaining?: number;
  hours_remaining?: number;
  is_expired?: boolean;
  is_urgent?: boolean;
  message: string;
}

// ============================================================================
// Social Proof Types
// ============================================================================

export interface RecentApproval {
  first_name: string;
  creator_type: string;
  niche: string;
  audience_size: string;
  approved_at: string;
}

export interface RecentApprovalsResponse {
  approvals: RecentApproval[];
  count: number;
}

// ============================================================================
// Enhanced Success Page Props
// ============================================================================

export interface SuccessPageData {
  applicationId: string;
  position: number;
  stats: ApplicationStats;
  deadline: BetaDeadline;
  recentApprovals: RecentApproval[];
  capacity: BetaCapacity;
}

// ============================================================================
// Scorecard Types
// ============================================================================

export type ScorecardMode = 'monetization' | 'impact' | 'personal';

export type ScorecardPersonaId =
  | 'gear_architect'
  | 'organized_creator'
  | 'aspiring_organizer'
  | 'emerging_curator'
  | 'fresh_start'
  | 'personal_organizer';

export interface ScorecardPersona {
  id: ScorecardPersonaId;
  name: string;
  description: string;
  emoji: string;
  color: 'emerald' | 'blue' | 'amber' | 'orange' | 'slate';
  frame: string;
}

export interface CategoryScores {
  organization: number;
  sharing: number;
  monetization?: number; // Present when mode = 'monetization'
  impact?: number; // Present when mode = 'impact'
  documentation: number;
}

export interface ScorecardOpportunity {
  category: keyof CategoryScores;
  title: string;
  description: string;
  icon: string;
  potentialGain: number;
}

export interface ScorecardResult {
  overallScore: number;
  categoryScores: CategoryScores;
  persona: ScorecardPersona;
  percentile: number;
  mode: ScorecardMode;
  topOpportunities: ScorecardOpportunity[];
}

export interface ScorecardData {
  score: number;
  categoryScores: CategoryScores;
  persona: ScorecardPersonaId;
  percentile: number;
  mode: ScorecardMode;
}
