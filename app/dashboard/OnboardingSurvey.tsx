'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { SurveyResponses } from '@/lib/types/beta';
import {
  CREATOR_TYPES, NICHES, AUDIENCE_SIZES, PLATFORMS,
  AFFILIATE_STATUS, REVENUE_GOALS, CURRENT_TOOLS,
  FRUSTRATIONS, USAGE_INTENT, DOCUMENTATION_HABITS,
} from '@/lib/surveyConstants';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

type Step = 1 | 2 | 3;

interface OnboardingSurveyProps {
  userName: string;
  userEmail: string;
  userHandle: string;
}

interface SurveyFormData {
  creator_type: string;
  primary_niche: string;
  primary_niche_other: string;
  audience_size: string;
  primary_platform: string;
  affiliate_status: string;
  revenue_goals: string;
  current_tools: string[];
  biggest_frustrations: string[];
  documentation_habits: string;
  magic_wand_feature: string;
  usage_intent: string;
}

export default function OnboardingSurvey({ userName, userEmail, userHandle }: OnboardingSurveyProps) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SurveyFormData>({
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
  });

  const updateField = (field: keyof SurveyFormData, value: string | string[]) => {
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
        return (
          formData.creator_type &&
          formData.primary_niche &&
          (formData.primary_niche !== 'other' || formData.primary_niche_other) &&
          formData.audience_size &&
          formData.primary_platform
        );
      case 2:
        return formData.affiliate_status && formData.revenue_goals && formData.current_tools.length > 0;
      case 3:
        return formData.biggest_frustrations.length > 0 && formData.documentation_habits && formData.usage_intent;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < 3) {
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

      const referralCode = searchParams.get('ref') || undefined;

      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyResponses,
          referralCode,
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

      // Redirect to profile after completing survey
      window.location.href = `/u/${userHandle}`;
    } catch (err) {
      console.error('Survey submission error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    setError(null);
    try {
      const response = await fetch('/api/survey/skip', { method: 'POST' });
      if (!response.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }
      window.location.href = `/u/${userHandle}`;
    } catch (err) {
      console.error('Skip error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] p-6 text-white">
            <div>
              <h2 className="text-2xl font-bold">One more step{userName ? `, ${userName.split(' ')[0]}` : ''}!</h2>
              <p className="text-white/80 mt-1">
                Step {step} of 3: {step === 1 ? 'Who You Are' : step === 2 ? 'Monetization' : 'Your Needs'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-[var(--teed-green-9)] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <div className="p-6">
            <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
              Tell us about yourself so we can personalize your experience
            </p>

            {/* Step 1: Who You Are */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Creator Type */}
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

                {/* Niche */}
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

                {/* Audience Size */}
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

                {/* Primary Platform */}
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

            {/* Step 2: Monetization */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Affiliate Status */}
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

                {/* Revenue Goals */}
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

                {/* Current Tools */}
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

            {/* Step 3: Your Needs */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Biggest Frustrations */}
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

                {/* Documentation Habits */}
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

                {/* Usage Intent */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                    When would you create your first bag?
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
              {step < 3 ? (
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
                      Finishing up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>

            {/* Skip link */}
            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                disabled={isSkipping}
                className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2"
              >
                {isSkipping ? 'Skipping...' : 'Skip for now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
