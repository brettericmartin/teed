/**
 * Strategic Proposals Types
 * Type definitions for the strategic proposals review system
 */

// ═══════════════════════════════════════════════════════════════════
// Status and Category Types
// ═══════════════════════════════════════════════════════════════════

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'needs_research';
export type ProposalCategory = 'vertical_expansion' | 'product_feature' | 'partnership' | 'infrastructure' | 'other';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ═══════════════════════════════════════════════════════════════════
// Main Proposal Interface
// ═══════════════════════════════════════════════════════════════════

export interface StrategicProposal {
  id: string;

  // Content
  title: string;
  summary: string;
  content: string;
  category: ProposalCategory;

  // Research metadata
  research_sources: string[] | null;
  confidence_level: ConfidenceLevel | null;

  // Decision tracking
  status: ProposalStatus;
  admin_feedback: string | null;
  decision_rationale: string | null;
  decided_by: string | null;
  decided_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;

  // Joined data
  decider?: {
    id: string;
    handle: string;
    display_name: string | null;
  } | null;
}

// ═══════════════════════════════════════════════════════════════════
// Stats Interface
// ═══════════════════════════════════════════════════════════════════

export interface ProposalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needs_research: number;
}

// ═══════════════════════════════════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════════════════════════════════

export interface ProposalListResponse {
  proposals: StrategicProposal[];
  stats: ProposalStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProposalUpdateRequest {
  status?: ProposalStatus;
  admin_feedback?: string;
  decision_rationale?: string;
}

export interface ProposalCreateRequest {
  title: string;
  summary: string;
  content: string;
  category: ProposalCategory;
  research_sources?: string[];
  confidence_level?: ConfidenceLevel;
}

// ═══════════════════════════════════════════════════════════════════
// Display Helpers
// ═══════════════════════════════════════════════════════════════════

export const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, {
  label: string;
  color: string;
  bg: string;
  borderHover: string;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-[var(--sky-11)]',
    bg: 'bg-[var(--sky-4)]',
    borderHover: 'border-[var(--sky-6)]',
  },
  approved: {
    label: 'Approved',
    color: 'text-[var(--teed-green-11)]',
    bg: 'bg-[var(--teed-green-4)]',
    borderHover: 'border-[var(--teed-green-6)]',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-[var(--grey-11)]',
    bg: 'bg-[var(--grey-4)]',
    borderHover: 'border-[var(--grey-6)]',
  },
  needs_research: {
    label: 'Needs Research',
    color: 'text-[var(--amber-11)]',
    bg: 'bg-[var(--amber-4)]',
    borderHover: 'border-[var(--amber-6)]',
  },
};

export const PROPOSAL_CATEGORY_CONFIG: Record<ProposalCategory, {
  label: string;
  color: string;
  bg: string;
}> = {
  vertical_expansion: {
    label: 'Vertical Expansion',
    color: 'text-[var(--evergreen-11)]',
    bg: 'bg-[var(--evergreen-4)]',
  },
  product_feature: {
    label: 'Product Feature',
    color: 'text-[var(--sky-11)]',
    bg: 'bg-[var(--sky-4)]',
  },
  partnership: {
    label: 'Partnership',
    color: 'text-[var(--copper-11)]',
    bg: 'bg-[var(--copper-4)]',
  },
  infrastructure: {
    label: 'Infrastructure',
    color: 'text-[var(--sand-11)]',
    bg: 'bg-[var(--sand-4)]',
  },
  other: {
    label: 'Other',
    color: 'text-[var(--grey-11)]',
    bg: 'bg-[var(--grey-4)]',
  },
};

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string;
  color: string;
}> = {
  high: { label: 'High Confidence', color: 'text-[var(--teed-green-11)]' },
  medium: { label: 'Medium Confidence', color: 'text-[var(--amber-11)]' },
  low: { label: 'Low Confidence', color: 'text-[var(--grey-11)]' },
};
