'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  email: string;
  name: string;
  use_case: string;
  use_case_other: string;
  experience_level: string;
  social_handle: string;
  platform: string;
  followers_count: string;
  excitement: string;
  referral_source: string;
  referral_other: string;
}

const USE_CASES = [
  { id: 'golf', label: 'Golf Gear', icon: '⛳', description: 'Share your bag setup with fellow golfers' },
  { id: 'fashion', label: 'Fashion / Haul', icon: '👗', description: 'Curate outfits and shopping hauls' },
  { id: 'tech', label: 'Tech / Gadgets', icon: '📱', description: 'Share your tech stack and gear' },
  { id: 'creator', label: 'Content Creator', icon: '🎬', description: 'Show your creative toolkit' },
  { id: 'other', label: 'Something Else', icon: '✨', description: 'I have a unique use case' },
];

const EXPERIENCE_LEVELS = [
  { id: 'new', label: 'New to This', description: 'Just getting started with content creation' },
  { id: 'casual', label: 'Casual Creator', description: 'Share occasionally with friends/followers' },
  { id: 'regular', label: 'Regular Creator', description: 'Consistently create and share content' },
  { id: 'professional', label: 'Professional', description: 'Content creation is part of my work' },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'other', label: 'Other' },
];

const REFERRAL_SOURCES = [
  { id: 'social', label: 'Social Media' },
  { id: 'friend', label: 'Friend/Colleague' },
  { id: 'search', label: 'Search Engine' },
  { id: 'creator', label: 'Creator I Follow' },
  { id: 'other', label: 'Other' },
];

export default function ApplyForm() {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    use_case: '',
    use_case_other: '',
    experience_level: '',
    social_handle: '',
    platform: '',
    followers_count: '',
    excitement: '',
    referral_source: '',
    referral_other: '',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.email && formData.name;
      case 2:
        return formData.use_case && (formData.use_case !== 'other' || formData.use_case_other);
      case 3:
        return formData.experience_level;
      case 4:
        return formData.referral_source && (formData.referral_source !== 'other' || formData.referral_other);
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

      // Build survey responses
      const surveyResponses = {
        use_case: formData.use_case === 'other' ? formData.use_case_other : formData.use_case,
        experience_level: formData.experience_level,
        platform: formData.platform,
        social_handle: formData.social_handle,
        followers_count: formData.followers_count,
        excitement: formData.excitement,
        referral_source: formData.referral_source === 'other' ? formData.referral_other : formData.referral_source,
      };

      // Insert application
      const { data, error: insertError } = await supabase
        .from('beta_applications')
        .insert({
          email: formData.email,
          name: formData.name,
          use_case: surveyResponses.use_case,
          social_handle: formData.social_handle || null,
          platform: formData.platform || null,
          followers_count: formData.followers_count || null,
          survey_responses: surveyResponses,
          referral_source: surveyResponses.referral_source,
        })
        .select('waitlist_position')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate email
          setError('This email has already applied. Check your inbox for updates!');
        } else {
          throw insertError;
        }
        return;
      }

      setWaitlistPosition(data?.waitlist_position || null);
      setIsComplete(true);
    } catch (err) {
      console.error('Application error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--teed-green-9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You're on the list!</h2>
        {waitlistPosition && (
          <p className="text-lg text-[var(--teed-green-9)] font-semibold mb-4">
            Position #{waitlistPosition}
          </p>
        )}
        <p className="text-[var(--text-secondary)] mb-6">
          We'll reach out when it's your turn. Keep an eye on your inbox!
        </p>
        <div className="bg-[var(--sky-2)] dark:bg-[var(--sky-3)] rounded-xl p-4 text-left">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Want to move up?</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Share your unique referral link with friends. Each person who joins moves you up 5 spots!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 dark:bg-zinc-800">
        <div
          className="h-full bg-[var(--teed-green-9)] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step
                  ? 'bg-[var(--teed-green-9)]'
                  : s < step
                  ? 'bg-[var(--teed-green-5)]'
                  : 'bg-gray-200 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Let's get started</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Tell us a bit about yourself</p>
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

        {/* Step 2: Use Case */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">What will you curate?</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Select the category that best fits you</p>
            </div>
            <div className="grid gap-3">
              {USE_CASES.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => updateField('use_case', useCase.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.use_case === useCase.id
                      ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{useCase.icon}</span>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{useCase.label}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{useCase.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {formData.use_case === 'other' && (
              <Input
                placeholder="Tell us more about your use case..."
                value={formData.use_case_other}
                onChange={(e) => updateField('use_case_other', e.target.value)}
                className="mt-4"
              />
            )}
          </div>
        )}

        {/* Step 3: Experience */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your experience level</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">This helps us tailor your onboarding</p>
            </div>
            <div className="grid gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => updateField('experience_level', level.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.experience_level === level.id
                      ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <p className="font-medium text-[var(--text-primary)]">{level.label}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{level.description}</p>
                </button>
              ))}
            </div>

            {/* Optional Social Info */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-sm text-[var(--text-secondary)] mb-4">Optional: Connect your social presence</p>
              <div className="grid gap-4">
                <div className="flex gap-2">
                  <select
                    value={formData.platform}
                    onChange={(e) => updateField('platform', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[var(--text-primary)] text-sm"
                  >
                    <option value="">Platform</option>
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="@yourhandle"
                    value={formData.social_handle}
                    onChange={(e) => updateField('social_handle', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <select
                  value={formData.followers_count}
                  onChange={(e) => updateField('followers_count', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[var(--text-primary)] text-sm"
                >
                  <option value="">Follower count (optional)</option>
                  <option value="0-1k">0 - 1,000</option>
                  <option value="1k-10k">1,000 - 10,000</option>
                  <option value="10k-100k">10,000 - 100,000</option>
                  <option value="100k+">100,000+</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Details */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Almost there!</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Just a couple more questions</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                How did you hear about Teed?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REFERRAL_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => updateField('referral_source', source.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      formData.referral_source === source.id
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    {source.label}
                  </button>
                ))}
              </div>
              {formData.referral_source === 'other' && (
                <Input
                  placeholder="Tell us more..."
                  value={formData.referral_other}
                  onChange={(e) => updateField('referral_other', e.target.value)}
                  className="mt-3"
                />
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                What excites you most about Teed? (optional)
              </label>
              <textarea
                value={formData.excitement}
                onChange={(e) => updateField('excitement', e.target.value)}
                placeholder="Tell us what you're looking forward to..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[var(--text-primary)] placeholder:text-gray-400 resize-none"
              />
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
            </Button>
          ) : (
            <Button
              variant="create"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Join the Waitlist'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
