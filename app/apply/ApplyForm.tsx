'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { BetaCapacityBadge } from '@/components/BetaCapacityCounter';
import type { SurveyResponses } from '@/lib/types/beta';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { calculateScorecardResult, serializeScorecardForDB } from '@/lib/scorecard';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Basic info
  email: string;
  name: string;

  // Step 1: Who You Are (4 questions)
  creator_type: string;
  primary_niche: string;
  primary_niche_other: string;
  audience_size: string;
  primary_platform: string;

  // Step 2: Monetization (3 questions)
  affiliate_status: string;
  revenue_goals: string;
  current_tools: string[];

  // Step 3: Your Needs (4 questions)
  biggest_frustrations: string[];  // Changed to array for multi-select
  documentation_habits: string;
  magic_wand_feature: string;
  usage_intent: string;

  // Referral
  referral_code: string;
}

// ============================================================================
// Question Options
// ============================================================================

const CREATOR_TYPES = [
  { id: 'professional_creator', label: 'Professional Creator', icon: '🎬', description: 'Content creation is my career' },
  { id: 'serious_hobbyist', label: 'Serious Hobbyist', icon: '🎯', description: 'I create content consistently as a passion' },
  { id: 'brand_ambassador', label: 'Brand Ambassador', icon: '🤝', description: 'I work with brands and do sponsorships' },
  { id: 'building_audience', label: 'Building My Audience', icon: '📈', description: 'Actively growing, not yet established' },
  { id: 'purely_casual', label: 'Purely Casual', icon: '🏡', description: 'I just share what I love with friends' },
];

const NICHES = [
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'tech_gadgets', label: 'Tech & Gadgets', icon: '📱' },
  { id: 'fashion', label: 'Fashion & Style', icon: '👔' },
  { id: 'outdoor_adventure', label: 'Outdoor & Adventure', icon: '🏔️' },
  { id: 'home_office', label: 'Home & Office', icon: '🏠' },
  { id: 'fitness', label: 'Fitness & Wellness', icon: '💪' },
  { id: 'other', label: 'Something Else', icon: '✨' },
];

const AUDIENCE_SIZES = [
  { id: 'friends_family', label: 'Just Friends & Family', description: 'Sharing with people I know' },
  { id: 'under_1k', label: 'Under 1,000', description: 'Just getting started' },
  { id: '1k_10k', label: '1,000 - 10,000', description: 'Growing steadily' },
  { id: '10k_50k', label: '10,000 - 50,000', description: 'Established creator' },
  { id: '50k_plus', label: '50,000+', description: 'Significant reach' },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', icon: '🎥' },
  { id: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { id: 'blog', label: 'Blog / Website', icon: '✍️' },
  { id: 'other', label: 'Other', icon: '🌐' },
];

const AFFILIATE_STATUS = [
  { id: 'actively', label: 'Yes, actively', description: 'I earn from affiliates regularly' },
  { id: 'sometimes', label: 'Sometimes', description: 'I use them occasionally' },
  { id: 'want_to_start', label: 'Want to start', description: "Haven't figured it out yet" },
  { id: 'not_interested', label: 'Not really', description: 'Not my focus right now' },
];

const REVENUE_GOALS = [
  { id: 'side_income', label: '$100-500/month', description: 'Nice side income' },
  { id: 'meaningful_income', label: '$500-2,000/month', description: 'Meaningful revenue' },
  { id: 'significant_income', label: '$2,000+/month', description: 'Significant income stream' },
  { id: 'not_priority', label: "Money isn't the goal", description: 'I just want to share' },
];

const CURRENT_TOOLS = [
  { id: 'linktree', label: 'Linktree' },
  { id: 'amazon_storefront', label: 'Amazon Storefront' },
  { id: 'ltk', label: 'LTK (Like to Know)' },
  { id: 'notion', label: 'Notion / Docs' },
  { id: 'instagram_guides', label: 'Instagram Guides' },
  { id: 'nothing', label: 'Nothing yet' },
  { id: 'other', label: 'Something else' },
];

const FRUSTRATIONS = [
  { id: 'time_consuming', label: 'Too time-consuming', description: 'Creating lists takes forever' },
  { id: 'looks_bad', label: "Doesn't look good", description: 'Current tools are ugly' },
  { id: 'no_analytics', label: 'No good analytics', description: "I don't know what works" },
  { id: 'affiliate_complexity', label: 'Affiliate links are complicated', description: 'Hard to set up and manage' },
  { id: 'repeated_questions', label: 'Audience keeps asking', description: 'Same questions over and over' },
];

const USAGE_INTENT = [
  { id: 'immediately', label: 'Within 24 hours', description: "I'm ready to go" },
  { id: 'this_week', label: 'This week', description: 'Soon, just need to gather items' },
  { id: 'explore_first', label: "I'd explore first", description: "Want to see what's possible" },
  { id: 'not_sure', label: 'Not sure', description: 'Depends on the experience' },
];

const DOCUMENTATION_HABITS = [
  { id: 'detailed_notes', label: 'I keep detailed notes', description: 'About why I chose each product' },
  { id: 'basic_tracking', label: 'Basic tracking', description: 'I know what I have, roughly' },
  { id: 'scattered_info', label: 'Info is scattered', description: 'Across apps, notes, bookmarks' },
  { id: 'nothing_organized', label: 'Nothing organized', description: 'I just remember or search again' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    creator_type: '',
    primary_niche: '',
    primary_niche_other: '',
    audience_size: '',
    primary_platform: '',
    affiliate_status: '',
    revenue_goals: '',
    current_tools: [],
    biggest_frustrations: [],  // Changed to array for multi-select
    documentation_habits: '',
    magic_wand_feature: '',
    usage_intent: '',
    referral_code: searchParams.get('ref') || '',
  });

  // Fetch application count for "Application #X" display
  useEffect(() => {
    supabase
      .from('beta_applications')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        setApplicationNumber((count || 0) + 1);
      });
  }, []);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleArrayField = (field: 'current_tools' | 'biggest_frustrations', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.email && formData.name;
      case 2:
        return (
          formData.creator_type &&
          formData.primary_niche &&
          (formData.primary_niche !== 'other' || formData.primary_niche_other) &&
          formData.audience_size &&
          formData.primary_platform
        );
      case 3:
        return formData.affiliate_status && formData.revenue_goals && formData.current_tools.length > 0;
      case 4:
        return formData.biggest_frustrations.length > 0 && formData.documentation_habits && formData.usage_intent;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const surveyResponses: SurveyResponses = {
        creator_type: formData.creator_type as SurveyResponses['creator_type'],
        primary_niche: formData.primary_niche as SurveyResponses['primary_niche'],
        primary_niche_other: formData.primary_niche_other,
        audience_size: formData.audience_size as SurveyResponses['audience_size'],
        primary_platform: formData.primary_platform as SurveyResponses['primary_platform'],
        affiliate_status: formData.affiliate_status as SurveyResponses['affiliate_status'],
        revenue_goals: formData.revenue_goals as SurveyResponses['revenue_goals'],
        current_tools: formData.current_tools,
        biggest_frustrations: formData.biggest_frustrations,  // Now an array
        documentation_habits: formData.documentation_habits as SurveyResponses['documentation_habits'],
        magic_wand_feature: formData.magic_wand_feature,
        usage_intent: formData.usage_intent as SurveyResponses['usage_intent'],
      };

      // Calculate the scorecard from survey responses
      const scorecardResult = calculateScorecardResult(surveyResponses);
      const scorecardData = serializeScorecardForDB(scorecardResult);

      // The ref parameter can be:
      // 1. An invite code (TEED-ABC123) -> goes in referred_by_code
      // 2. An application UUID -> goes in referred_by_application_id
      // 3. A custom referral code (SARAH2024) -> lookup the application ID
      const refValue = formData.referral_code || null;
      const isUUID = refValue && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refValue);
      const isInviteCode = refValue && /^TEED-[A-Z0-9]+$/i.test(refValue);

      // If it's not a UUID and not an invite code, it might be a custom referral code
      // Try to lookup the referrer application ID
      let referrerAppId: string | null = isUUID ? refValue : null;

      if (refValue && !isUUID && !isInviteCode) {
        // Lookup custom referral code
        const { data: lookupData } = await supabase.rpc('lookup_referrer', {
          ref_value: refValue,
        });
        if (lookupData) {
          referrerAppId = lookupData;
        }
      }

      const { data, error: insertError } = await supabase
        .from('beta_applications')
        .insert({
          email: formData.email,
          name: formData.name,
          full_name: formData.name,
          primary_use_case: formData.primary_niche === 'other' ? formData.primary_niche_other : formData.primary_niche,
          use_case: formData.primary_niche === 'other' ? formData.primary_niche_other : formData.primary_niche,
          follower_range: formData.audience_size,
          social_platform: formData.primary_platform,
          monetization_interest: formData.affiliate_status === 'actively' || formData.affiliate_status === 'sometimes',
          biggest_challenge: formData.biggest_frustrations[0] || null,  // First frustration for backward compat
          survey_responses: surveyResponses,
          referred_by_code: isInviteCode ? refValue : null, // Only set if it's an invite code (TEED-xxx)
          referred_by_application_id: referrerAppId, // Set if we resolved an application ID
          source: refValue ? 'referral' : 'organic',
          // Scorecard data
          ...scorecardData,
        })
        .select('waitlist_position, id')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This email has already applied. Check your inbox for updates!');
        } else {
          throw insertError;
        }
        return;
      }

      // Redirect to success page with position
      router.push(`/apply/success?position=${data?.waitlist_position || 0}&id=${data?.id}`);
    } catch (err) {
      console.error('Application error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Founding Member Application</h2>
            <p className="text-white/80 mt-1">
              Step {step} of 4: {step === 1 ? 'Your Info' : step === 2 ? 'Who You Are' : step === 3 ? 'Monetization' : 'Your Needs'}
            </p>
          </div>
          <div className="text-right">
            {applicationNumber && (
              <span className="text-sm text-white/60">
                Application #{applicationNumber}
              </span>
            )}
            <BetaCapacityBadge className="mt-1" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 dark:bg-zinc-800">
        <div
          className="h-full bg-[var(--teed-green-9)] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Let's get started</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">We'll use this to keep you updated</p>
            </div>
            <Input
              label="Your Name"
              placeholder="Alex Johnson"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
        )}

        {/* Step 2: Who You Are (4 questions) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Tell us about yourself</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">This helps us understand your needs</p>
            </div>

            {/* Q1: Creator Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                What best describes you?
              </label>
              <div className="grid gap-3">
                {CREATOR_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateField('creator_type', type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.creator_type === type.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{type.label}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Niche */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                What's your primary niche?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => updateField('primary_niche', niche.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.primary_niche === niche.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{niche.icon}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{niche.label}</span>
                  </button>
                ))}
              </div>
              {formData.primary_niche === 'other' && (
                <Input
                  placeholder="Tell us your niche..."
                  value={formData.primary_niche_other}
                  onChange={(e) => updateField('primary_niche_other', e.target.value)}
                  className="mt-3"
                />
              )}
            </div>

            {/* Q3: Audience Size */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Total audience size (across all platforms)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_SIZES.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => updateField('audience_size', size.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.audience_size === size.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{size.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{size.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Primary Platform */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Primary platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => updateField('primary_platform', platform.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.primary_platform === platform.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{platform.icon}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{platform.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Monetization (3 questions) */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">About monetization</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Help us understand your goals</p>
            </div>

            {/* Q5: Affiliate Status */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Do you currently use affiliate links?
              </label>
              <div className="grid gap-3">
                {AFFILIATE_STATUS.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => updateField('affiliate_status', status.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.affiliate_status === status.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{status.label}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{status.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Q6: Revenue Goals */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                What would successful monetization look like?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REVENUE_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => updateField('revenue_goals', goal.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.revenue_goals === goal.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{goal.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{goal.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Q7: Current Tools (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                What do you currently use to share products? <span className="text-[var(--text-tertiary)]">(select all)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CURRENT_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleArrayField('current_tools', tool.id)}
                    className={`px-4 py-2 rounded-full border-2 text-sm transition-all ${
                      formData.current_tools.includes(tool.id)
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-9)] text-white'
                        : 'border-gray-200 dark:border-zinc-700 text-[var(--text-primary)] hover:border-gray-300'
                    }`}
                  >
                    {formData.current_tools.includes(tool.id) && <Check className="w-3 h-3 inline mr-1" />}
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Your Needs (3 questions) */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Almost there!</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Help us understand what you need</p>
            </div>

            {/* Q8: Biggest Frustrations (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                What frustrates you about sharing product recommendations? <span className="text-[var(--text-tertiary)]">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {FRUSTRATIONS.map((frustration) => (
                  <button
                    key={frustration.id}
                    type="button"
                    onClick={() => toggleArrayField('biggest_frustrations', frustration.id)}
                    className={`px-4 py-2 rounded-full border-2 text-sm transition-all ${
                      formData.biggest_frustrations.includes(frustration.id)
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-9)] text-white'
                        : 'border-gray-200 dark:border-zinc-700 text-[var(--text-primary)] hover:border-gray-300'
                    }`}
                    title={frustration.description}
                  >
                    {formData.biggest_frustrations.includes(frustration.id) && <Check className="w-3 h-3 inline mr-1" />}
                    {frustration.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q9: Documentation Habits */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                How do you currently track your gear and recommendations?
              </label>
              <div className="grid gap-3">
                {DOCUMENTATION_HABITS.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => updateField('documentation_habits', habit.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.documentation_habits === habit.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{habit.label}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{habit.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Q10: Usage Intent */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                If accepted, when would you create your first bag?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {USAGE_INTENT.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => updateField('usage_intent', intent.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.usage_intent === intent.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{intent.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{intent.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="ghost" onClick={handleBack} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              variant="create"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="create"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
