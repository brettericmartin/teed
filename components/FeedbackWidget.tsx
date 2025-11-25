'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
}

export default function FeedbackWidget({ position = 'bottom-right' }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'question'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);

    try {
      await supabase.from('feedback').insert({
        user_id: userId,
        type,
        title,
        description,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        status: 'new',
      });

      // Award points
      const points = type === 'bug' ? 30 : type === 'feature' ? 20 : 5;
      const counterField = type === 'bug' ? 'bugs_reported' : type === 'feature' ? 'features_suggested' : null;

      await supabase.rpc('award_beta_points', {
        target_user_id: userId,
        points,
        reason: `${type}_submitted`,
        counter_field: counterField,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsExpanded(false);
        setIsSuccess(false);
        setTitle('');
        setDescription('');
      }, 2000);
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render for non-authenticated users
  if (!userId) return null;

  const positionClasses = position === 'bottom-right' ? 'right-4' : 'left-4';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 ${positionClasses} z-40 p-3 bg-[var(--teed-green-9)] text-white rounded-full shadow-lg hover:bg-[var(--teed-green-10)] transition-all hover:scale-105 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Open feedback"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Feedback Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-20 ${positionClasses} z-40 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden`}
        >
          {isSuccess ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-[var(--teed-green-2)] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[var(--teed-green-9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-[var(--text-primary)]">Thanks for your feedback!</p>
            </div>
          ) : !isExpanded ? (
            <div className="p-4">
              <p className="font-medium text-[var(--text-primary)] mb-3">How can we help?</p>
              <div className="space-y-2">
                <button
                  onClick={() => { setType('bug'); setIsExpanded(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-xl">🐛</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Report a bug</span>
                </button>
                <button
                  onClick={() => { setType('feature'); setIsExpanded(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-xl">💡</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Suggest a feature</span>
                </button>
                <button
                  onClick={() => { setType('question'); setIsExpanded(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-xl">❓</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Ask a question</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                >
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xl">{type === 'bug' ? '🐛' : type === 'feature' ? '💡' : '❓'}</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {type === 'bug' ? 'Report Bug' : type === 'feature' ? 'Suggest Feature' : 'Ask Question'}
                </span>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary"
                required
                className="w-full px-3 py-2 mb-3 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text-primary)] placeholder:text-gray-400"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more..."
                rows={3}
                required
                className="w-full px-3 py-2 mb-3 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text-primary)] placeholder:text-gray-400 resize-none"
              />

              <button
                type="submit"
                disabled={isSubmitting || !title || !description}
                className="w-full py-2 px-4 bg-[var(--teed-green-9)] text-white text-sm font-medium rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
