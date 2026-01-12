/**
 * Strategic Initiatives Types
 * For the Advisory Board feature evaluation and strategic planning system
 */

// ────────────────────────────────────────────────────────────
// Enums and Constants
// ────────────────────────────────────────────────────────────

export type InitiativeStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'archived';

export type InitiativeCategory =
  | 'infrastructure'
  | 'growth'
  | 'monetization'
  | 'product'
  | 'b2b'
  | 'platform';

export type EstimatedEffort = 'small' | 'medium' | 'large' | 'xlarge';

export type AdvisorId =
  | 'daniel_priestley'
  | 'julie_zhuo'
  | 'li_jin'
  | 'emily_heyward'
  | 'codie_sanchez';

export type AdvisorVerdict = 'approved' | 'needs_work' | 'rejected';

export type CommentType =
  | 'feedback'
  | 'question'
  | 'approval'
  | 'revision_request'
  | 'implementation_note';

// ────────────────────────────────────────────────────────────
// Advisory Board Evaluation Types
// ────────────────────────────────────────────────────────────

export interface AdvisorScore {
  score: number;           // 1-10
  verdict: AdvisorVerdict;
  criteria: AdvisorCriterion[];
  notes: string;
}

export interface AdvisorCriterion {
  name: string;
  passed: boolean;
  notes?: string;
}

export interface BoardEvaluation {
  daniel_priestley?: AdvisorScore;
  julie_zhuo?: AdvisorScore;
  li_jin?: AdvisorScore;
  emily_heyward?: AdvisorScore;
  codie_sanchez?: AdvisorScore;
  overall_score?: number;    // Sum of all scores
  board_decision?: string;   // "5/5 APPROVAL", "4/5 APPROVAL", etc.
  evaluated_at?: string;
}

export interface DoctrineCheck {
  check: string;
  passed: boolean;
  notes?: string;
}

// ────────────────────────────────────────────────────────────
// Feature Planning Types
// ────────────────────────────────────────────────────────────

export interface UserStory {
  id: string;
  persona: string;          // "Creator", "Brand", "Team Admin"
  story: string;            // "As a [persona], I want to [action] so that [benefit]"
  acceptance_criteria: string[];
  priority: 'must_have' | 'should_have' | 'nice_to_have';
}

export interface FeaturePhase {
  phase: number;
  title: string;
  description: string;
  features: string[];
  deliverables: string[];
  dependencies?: string[];
}

export interface SuccessMetric {
  metric: string;
  target: string;
  rationale: string;
  measurement_method?: string;
}

export interface Risk {
  risk: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// ────────────────────────────────────────────────────────────
// Main Initiative Type
// ────────────────────────────────────────────────────────────

export interface StrategicInitiative {
  id: string;

  // Core info
  title: string;
  slug: string;
  category: InitiativeCategory;
  priority: number;
  status: InitiativeStatus;

  // Executive summary
  tagline?: string;
  executive_summary?: string;
  problem_statement?: string;
  solution_overview?: string;

  // Detailed plan
  full_plan?: string;
  technical_architecture?: string;
  user_stories: UserStory[];
  feature_phases: FeaturePhase[];

  // Business case
  success_metrics: SuccessMetric[];
  risk_assessment: Risk[];
  resource_requirements?: string;
  estimated_effort?: EstimatedEffort;

  // Board evaluation
  board_evaluation: BoardEvaluation;
  doctrine_compliance: DoctrineCheck[];
  board_notes?: string;

  // Workflow
  created_by_admin_id?: string;
  reviewed_at?: string;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;

  // Versioning
  version: number;
  previous_version_id?: string;
  revision_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────
// Comments Type
// ────────────────────────────────────────────────────────────

export interface InitiativeComment {
  id: string;
  initiative_id: string;
  admin_id: string;

  comment: string;
  advisor_perspective?: AdvisorId | 'general';
  comment_type: CommentType;

  parent_comment_id?: string;

  is_resolved: boolean;
  resolved_at?: string;
  resolved_by_admin_id?: string;

  created_at: string;
  updated_at: string;

  // Joined fields
  admin_name?: string;
  admin_avatar?: string;
  replies?: InitiativeComment[];
}

// ────────────────────────────────────────────────────────────
// API Types
// ────────────────────────────────────────────────────────────

export interface InitiativeListItem {
  id: string;
  title: string;
  slug: string;
  category: InitiativeCategory;
  status: InitiativeStatus;
  tagline?: string;
  priority: number;
  estimated_effort?: EstimatedEffort;
  overall_score?: number;
  board_decision?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInitiativeInput {
  title: string;
  slug: string;
  category: InitiativeCategory;
  tagline?: string;
  executive_summary?: string;
  problem_statement?: string;
  solution_overview?: string;
  full_plan?: string;
  technical_architecture?: string;
  user_stories?: UserStory[];
  feature_phases?: FeaturePhase[];
  success_metrics?: SuccessMetric[];
  risk_assessment?: Risk[];
  resource_requirements?: string;
  estimated_effort?: EstimatedEffort;
  priority?: number;
}

export interface UpdateInitiativeInput extends Partial<CreateInitiativeInput> {
  status?: InitiativeStatus;
  board_evaluation?: BoardEvaluation;
  doctrine_compliance?: DoctrineCheck[];
  board_notes?: string;
  revision_notes?: string;
}

export interface AddCommentInput {
  initiative_id: string;
  comment: string;
  advisor_perspective?: AdvisorId | 'general';
  comment_type?: CommentType;
  parent_comment_id?: string;
}

// ────────────────────────────────────────────────────────────
// Advisor Metadata (for UI)
// ────────────────────────────────────────────────────────────

export interface AdvisorInfo {
  id: AdvisorId;
  name: string;
  focus: string;
  keyQuestion: string;
  criteria: string[];
  color: string;
}

export const ADVISORS: Record<AdvisorId, AdvisorInfo> = {
  daniel_priestley: {
    id: 'daniel_priestley',
    name: 'Daniel Priestley',
    focus: 'Growth & Demand Generation',
    keyQuestion: 'Does this create visible demand/supply tension?',
    criteria: [
      '7/11/4 amplification (multiplies touchpoints across locations)',
      '24/7 asset (works while creator sleeps)',
      'Compound value (gets more valuable over time)',
      'Demand signaling (collects signals of interest)',
      'Campaign rhythm (creates momentum)'
    ],
    color: 'amber'
  },
  julie_zhuo: {
    id: 'julie_zhuo',
    name: 'Julie Zhuo',
    focus: 'Product & Design',
    keyQuestion: 'Does this feel discovered, not disrupted?',
    criteria: [
      'Simplicity (one-click path exists)',
      'Progressive disclosure (depth without overwhelm)',
      'Native feel (belongs where it appears)',
      'Controversial principle (reflects distinctive choice)',
      'User respect (both power users and new users)'
    ],
    color: 'sky'
  },
  li_jin: {
    id: 'li_jin',
    name: 'Li Jin',
    focus: 'Creator Economy & Ownership',
    keyQuestion: 'Does this increase creator control and leverage?',
    criteria: [
      'Creator leverage (increases creator control)',
      'Platform independence (reduces platform risk)',
      'Attribution (credit flows to creator)',
      'Data ownership (creators can export/leave)',
      'Works for all creators (emerging AND established)'
    ],
    color: 'teed-green'
  },
  emily_heyward: {
    id: 'emily_heyward',
    name: 'Emily Heyward',
    focus: 'Brand & Language',
    keyQuestion: 'Would creators proudly show this branding?',
    criteria: [
      'Visual premium (muted, earthy, restrained)',
      'Language authority (confident, not desperate)',
      'Emotional connection (what do users FEEL?)',
      'Brand pride (creators would show off branding)',
      'Focus (not trying to do everything)'
    ],
    color: 'copper'
  },
  codie_sanchez: {
    id: 'codie_sanchez',
    name: 'Codie Sanchez',
    focus: 'Infrastructure & Contrarian Value',
    keyQuestion: 'Is this picks-and-shovels that enables everyone?',
    criteria: [
      'Boring reliability (durable, unglamorous approach)',
      'Cash flow mindset (generates consistent value)',
      'Practical value (businessperson would invest)',
      'Infrastructure play (enables others, not competes)',
      'Platform independence (works regardless of who wins)'
    ],
    color: 'evergreen'
  }
};

// ────────────────────────────────────────────────────────────
// Doctrine Checks
// ────────────────────────────────────────────────────────────

export const DOCTRINE_CHECKS = [
  {
    id: 'hierarchy',
    label: 'Bags > Items > Links > Profile (hierarchy preserved)',
    description: 'Feature respects the sacred hierarchy'
  },
  {
    id: 'no_obligation',
    label: 'No obligation/pressure language',
    description: 'No urgency, FOMO, or guilt-inducing copy'
  },
  {
    id: 'constructive_dopamine',
    label: 'Constructive dopamine only',
    description: 'Rewards building, not returning to check'
  },
  {
    id: 'stale_test',
    label: 'Passes the "stale test" (2-year-old content still valid)',
    description: 'Old bags feel like well-organized libraries'
  },
  {
    id: 'no_feed',
    label: 'No feed or infinite scroll',
    description: 'Intentional navigation only'
  },
  {
    id: 'creator_first',
    label: 'Creator attribution comes first',
    description: 'Teed branding is subtle, creator is prominent'
  }
];
