'use client';

import { useState } from 'react';
import { Settings, Loader2, AlertTriangle } from 'lucide-react';
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

interface CapacityModalProps {
  capacity: Capacity;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CapacityModal({
  capacity,
  onClose,
  onUpdate,
}: CapacityModalProps) {
  const [totalCapacity, setTotalCapacity] = useState(capacity.total);
  const [reservedForCodes, setReservedForCodes] = useState(capacity.reserved_for_codes);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setError('');
    setUpdating(true);

    try {
      const res = await fetch('/api/admin/beta/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_capacity: totalCapacity,
          reserved_for_codes: reservedForCodes,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onUpdate();
        onClose();
      } else {
        setError(data.error || 'Failed to update capacity');
      }
    } catch (err) {
      setError('Failed to update capacity');
    } finally {
      setUpdating(false);
    }
  };

  const newEffective = totalCapacity - reservedForCodes;
  const newAvailable = Math.max(0, newEffective - capacity.used);
  const willBeAtCapacity = newAvailable <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--sand-3)] rounded-lg">
              <Settings className="w-6 h-6 text-[var(--text-secondary)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Capacity Settings
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Manage beta capacity limits
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--sand-2)] rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {capacity.used}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {capacity.total}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {capacity.pending_applications}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Pending</div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Total capacity */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Total Capacity
            </label>
            <input
              type="number"
              value={totalCapacity}
              onChange={(e) => setTotalCapacity(Math.max(capacity.used, parseInt(e.target.value) || capacity.used))}
              min={capacity.used}
              max={10000}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Min: {capacity.used} (current users)
            </p>
          </div>

          {/* Reserved for codes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Reserved for Invite Codes
            </label>
            <input
              type="number"
              value={reservedForCodes}
              onChange={(e) => setReservedForCodes(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              max={totalCapacity - capacity.used}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Slots held back for direct invite codes
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-[var(--sand-2)] rounded-lg">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              After update:
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--text-tertiary)]">Effective capacity:</span>
                <span className="ml-2 font-medium text-[var(--text-primary)]">
                  {newEffective}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Available slots:</span>
                <span className={`ml-2 font-medium ${willBeAtCapacity ? 'text-red-600' : 'text-green-600'}`}>
                  {newAvailable}
                </span>
              </div>
            </div>
            {willBeAtCapacity && (
              <p className="text-xs text-red-600 mt-2">
                Warning: This will put the beta at capacity
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="create"
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Capacity'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
