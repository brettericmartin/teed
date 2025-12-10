'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

interface FeedbackModalProps {
  type: 'bug' | 'feature' | 'question' | 'praise';
  userId: string;
  onClose: () => void;
}

const TYPE_CONFIG = {
  bug: {
    title: 'Report a Bug',
    icon: '🐛',
    placeholder: 'Describe the bug you encountered...',
    titlePlaceholder: 'Brief summary of the issue',
    points: 30,
  },
  feature: {
    title: 'Suggest a Feature',
    icon: '💡',
    placeholder: 'Describe the feature you\'d like to see...',
    titlePlaceholder: 'Feature name or summary',
    points: 20,
  },
  question: {
    title: 'Ask a Question',
    icon: '❓',
    placeholder: 'What would you like to know?',
    titlePlaceholder: 'Your question',
    points: 5,
  },
  praise: {
    title: 'Share Praise',
    icon: '💚',
    placeholder: 'Tell us what you love about Teed...',
    titlePlaceholder: 'What do you love?',
    points: 10,
  },
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low - Minor annoyance' },
  { value: 'medium', label: 'Medium - Should be fixed' },
  { value: 'high', label: 'High - Blocking me' },
  { value: 'critical', label: 'Critical - App is broken' },
];

export default function FeedbackModal({ type, userId, onClose }: FeedbackModalProps) {
  const config = TYPE_CONFIG[type];
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {

      // Get current page URL for context
      const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

      // Insert feedback
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: userId,
        type,
        subject,
        message,
        priority: type === 'bug' ? priority : null,
        page_url: pageUrl,
        user_agent: userAgent,
        status: 'new',
      });

      if (insertError) throw insertError;

      // Award points
      const counterField = type === 'bug' ? 'bugs_reported' : type === 'feature' ? 'features_suggested' : null;
      await supabase.rpc('award_beta_points', {
        target_user_id: userId,
        points: config.points,
        reason: `${type}_submitted`,
        counter_field: counterField,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Feedback error:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-[var(--teed-green-2)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--teed-green-9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Thank You!</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Your feedback has been submitted. You earned <span className="font-semibold text-[var(--teed-green-9)]">+{config.points} points</span>!
          </p>
          <Button variant="create" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={config.titlePlaceholder}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[var(--text-primary)] placeholder:text-gray-400 resize-none"
            />
          </div>

          {type === 'bug' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[var(--text-primary)]"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="create"
              disabled={isSubmitting || !subject || !message}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : `Submit (+${config.points} pts)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
