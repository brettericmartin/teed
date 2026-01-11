'use client';

import { useState, useEffect } from 'react';
import { Zap, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Capacity {
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

interface PreviewApplication {
  id: string;
  name: string;
  email: string;
  priority_score: number;
  referral_tier: number;
  successful_referrals: number;
  approval_odds_percent: number;
}

interface BatchApproveModalProps {
  capacity: Capacity | null;
  onClose: () => void;
  onApprove: (count: number, tier: string) => void;
}

const TIER_OPTIONS = [
  { value: 'founder', label: 'Founder (Special)' },
  { value: 'standard', label: 'Standard' },
];

export default function BatchApproveModal({
  capacity,
  onClose,
  onApprove,
}: BatchApproveModalProps) {
  const [count, setCount] = useState(capacity?.available || 5);
  const [tier, setTier] = useState('standard');
  const [preview, setPreview] = useState<PreviewApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const maxCount = Math.min(capacity?.available || 0, capacity?.pending_applications || 0, 100);

  // Fetch preview when count changes
  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/beta/applications/batch?count=${count}`);
        const data = await res.json();
        if (res.ok) {
          setPreview(data.applications || []);
        }
      } catch (error) {
        console.error('Error fetching preview:', error);
      } finally {
        setLoading(false);
      }
    };

    if (count > 0) {
      fetchPreview();
    }
  }, [count]);

  const handleApprove = async () => {
    setApproving(true);
    await onApprove(count, tier);
    setApproving(false);
  };

  const TIER_NAMES = ['Standard', 'Engaged', 'Connector', 'Champion', 'Legend'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--teed-green-3)] rounded-lg">
              <Zap className="w-6 h-6 text-[var(--teed-green-9)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Batch Approve Applications
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Approve the top applications by priority score
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-[var(--border-subtle)] space-y-4">
          {/* Capacity warning */}
          {capacity?.is_at_capacity && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Beta is at capacity. Increase capacity before approving.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Count input */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Number to approve
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                min={1}
                max={maxCount}
                className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Max: {maxCount} ({capacity?.available} available, {capacity?.pending_applications} pending)
              </p>
            </div>

            {/* Tier select */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Assign tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview List */}
        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Preview: Top {count} applications
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : preview.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              No pending applications to approve
            </p>
          ) : (
            <div className="space-y-2">
              {preview.map((app, index) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-3 bg-[var(--sand-2)] rounded-lg"
                >
                  <span className="text-sm font-medium text-[var(--text-tertiary)] w-6">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">
                      {app.name}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] truncate">
                      {app.email}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {app.priority_score}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {TIER_NAMES[app.referral_tier || 0]}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {app.successful_referrals || 0} referrals
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="create"
            onClick={handleApprove}
            disabled={approving || count === 0 || capacity?.is_at_capacity}
          >
            {approving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Approving...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Approve {count} Applications
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
