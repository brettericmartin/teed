'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { BetaCapacityBadge } from '@/components/BetaCapacityCounter';
import type { SurveyResponses } from '@/lib/types/beta';
import {
  CREATOR_TYPES, NICHES, AUDIENCE_SIZES, PLATFORMS,
  AFFILIATE_STATUS, REVENUE_GOALS, CURRENT_TOOLS,
  FRUSTRATIONS, USAGE_INTENT, DOCUMENTATION_HABITS,
} from '@/lib/surveyConstants';
import { ChevronLeft, ChevronRight, Check, Loader2, X } from 'lucide-react';
import { analytics } from '@/lib/analytics';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Basic info + account
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  handle: string;

  // Step 2: Who You Are (4 questions)
  creator_type: string;
  primary_niche: string;
  primary_niche_other: string;
  audience_size: string;
  primary_platform: string;

  // Step 3: Monetization (3 questions)
  affiliate_status: string;
  revenue_goals: string;
  current_tools: string[];

  // Step 4: Your Needs (4 questions)
  biggest_frustrations: string[];
  documentation_habits: string;
  magic_wand_feature: string;
  usage_intent: string;

  // Referral
  referral_code: string;
}

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

  // Handle availability state
  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    handle: '',
    creator_type: '',
    primary_niche: '',
    primary_niche_other: '',
    audience_size: '',
    primary_platform: '',
    affiliate_status: '',
    revenue_goals: '',
    current_tools: [],
    biggest_frustrations: [],
    documentation_habits: '',
    magic_wand_feature: '',
    usage_intent: '',
    referral_code: searchParams.get('ref') || '',
  });

  // Fetch application count for "Application #X" display
  useEffect(() => {
    analytics.pageViewed('apply');
    supabase
      .from('beta_applications')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        setApplicationNumber((count || 0) + 1);
      });
  }, []);

  // Check handle availability with debouncing
  useEffect(() => {
    const cleanHandle = formData.handle.trim().toLowerCase();

    if (cleanHandle.length === 0) {
      setHandleAvailability({ checking: false, available: null, error: null });
      return;
    }

    if (cleanHandle.length < 3) {
      setHandleAvailability({
        checking: false,
        available: false,
        error: 'Handle must be at least 3 characters',
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
      setHandleAvailability({
        checking: false,
        available: false,
        error: 'Only lowercase letters, numbers, and underscores',
      });
      return;
    }

    setHandleAvailability({ checking: true, available: null, error: null });

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/profile/handle-available/${cleanHandle}`);
        const data = await response.json();

        if (data.error) {
          setHandleAvailability({ checking: false, available: false, error: data.error });
        } else {
          setHandleAvailability({
            checking: false,
            available: data.available,
            error: data.available ? null : 'Handle is already taken',
          });
        }
      } catch {
        setHandleAvailability({ checking: false, available: false, error: 'Failed to check availability' });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.handle]);

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

  const passwordError = formData.password && formData.password.length < 8
    ? 'Password must be at least 8 characters'
    : null;

  const confirmPasswordError = formData.confirmPassword && formData.password !== formData.confirmPassword
    ? 'Passwords do not match'
    : null;

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          formData.email &&
          formData.name &&
          formData.password.length >= 8 &&
          formData.password === formData.confirmPassword &&
          formData.handle.length >= 3 &&
          handleAvailability.available === true
        );
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
        biggest_frustrations: formData.biggest_frustrations,
        documentation_habits: formData.documentation_habits as SurveyResponses['documentation_habits'],
        magic_wand_feature: formData.magic_wand_feature,
        usage_intent: formData.usage_intent as SurveyResponses['usage_intent'],
      };

      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          handle: formData.handle.trim().toLowerCase(),
          surveyResponses,
          referralCode: formData.referral_code || undefined,
          primaryNiche: formData.primary_niche,
          primaryNicheOther: formData.primary_niche_other,
          audienceSize: formData.audience_size,
          primaryPlatform: formData.primary_platform,
          affiliateStatus: formData.affiliate_status,
          biggestFrustrations: formData.biggest_frustrations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Sign in to establish client session
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      analytics.betaApplied(data.applicationId, formData.referral_code || undefined, formData.creator_type || undefined);

      // Redirect to success page
      router.push(
        `/apply/success?position=${data.waitlistPosition || 0}&id=${data.applicationId}&approved=${data.autoApproved}`
      );
    } catch (err) {
      console.error('Application error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Founding Member Application</h2>
            <p className="text-white/80 mt-1">
              Step {step} of 4: {step === 1 ? 'Your Account' : step === 2 ? 'Who You Are' : step === 3 ? 'Monetization' : 'Your Needs'}
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
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-[var(--teed-green-9)] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-6">
        {/* Step 1: Account Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Create your account</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">This creates your Teed account so you can sign in anytime</p>
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
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={passwordError || undefined}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={confirmPasswordError || undefined}
            />

            {/* Handle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Choose a Handle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  @
                </div>
                <input
                  type="text"
                  value={formData.handle}
                  onChange={(e) => updateField('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full pl-8 pr-12 px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-400 dark:hover:border-zinc-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="your_handle"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {handleAvailability.checking && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {!handleAvailability.checking && handleAvailability.available === true && (
                    <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                  )}
                  {!handleAvailability.checking && handleAvailability.available === false && (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {handleAvailability.error && (
                <p className="mt-1 text-xs text-red-500">{handleAvailability.error}</p>
              )}
              {handleAvailability.available && (
                <p className="mt-1 text-xs text-[var(--teed-green-9)]">Handle is available!</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Your unique URL: teed.co/@{formData.handle || 'you'}
              </p>
            </div>
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 text-[var(--text-primary)] hover:border-gray-300'
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
                        : 'border-gray-200 text-[var(--text-primary)] hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300'
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
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
                  Creating account...
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
