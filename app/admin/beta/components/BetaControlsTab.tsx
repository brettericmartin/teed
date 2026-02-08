'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BetaControlsTabProps {
  admin: { role: string };
}

interface SettingsState {
  beta_capacity: number;
  reserved_for_codes: number;
  founding_cohort_deadline: string;
  auto_approval_enabled: boolean;
  auto_approval_priority_threshold: number;
  beta_phase: string;
  waitlist_message: string;
}

type SectionKey = 'capacity' | 'deadline' | 'autoApproval' | 'phase' | 'waitlist';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function BetaControlsTab({ admin }: BetaControlsTabProps) {
  const [settings, setSettings] = useState<SettingsState>({
    beta_capacity: 100,
    reserved_for_codes: 10,
    founding_cohort_deadline: '',
    auto_approval_enabled: false,
    auto_approval_priority_threshold: 80,
    beta_phase: 'founding',
    waitlist_message: '',
  });
  const [capacityInfo, setCapacityInfo] = useState<{ used: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStates, setSaveStates] = useState<Record<SectionKey, SaveState>>({
    capacity: 'idle',
    deadline: 'idle',
    autoApproval: 'idle',
    phase: 'idle',
    waitlist: 'idle',
  });
  const [errors, setErrors] = useState<Record<SectionKey, string>>({
    capacity: '',
    deadline: '',
    autoApproval: '',
    phase: '',
    waitlist: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/beta/settings');
      const data = await res.json();
      if (res.ok) {
        const s = data.settings || {};
        const cap = data.capacity;
        setSettings({
          beta_capacity: cap?.total ?? s.beta_capacity ?? 100,
          reserved_for_codes: cap?.reserved_for_codes ?? s.reserved_for_codes ?? 10,
          founding_cohort_deadline: s.founding_cohort_deadline || '',
          auto_approval_enabled: s.auto_approval_enabled === true || s.auto_approval_enabled === 'true',
          auto_approval_priority_threshold: Number(s.auto_approval_priority_threshold) || 80,
          beta_phase: s.beta_phase || 'founding',
          waitlist_message: s.waitlist_message || '',
        });
        if (cap) {
          setCapacityInfo({ used: cap.used, pending: cap.pending_applications });
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const setSaveState = (section: SectionKey, state: SaveState) => {
    setSaveStates(prev => ({ ...prev, [section]: state }));
    if (state === 'saved') {
      setTimeout(() => setSaveStates(prev => ({ ...prev, [section]: 'idle' })), 2000);
    }
  };

  const setError = (section: SectionKey, msg: string) => {
    setErrors(prev => ({ ...prev, [section]: msg }));
  };

  const patchSetting = async (key: string, value: any) => {
    const res = await fetch('/api/admin/beta/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save');
    }
  };

  const saveCapacity = async () => {
    setSaveState('capacity', 'saving');
    setError('capacity', '');
    try {
      const res = await fetch('/api/admin/beta/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_capacity: settings.beta_capacity,
          reserved_for_codes: settings.reserved_for_codes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update capacity');
      }
      setSaveState('capacity', 'saved');
      // Refresh capacity info
      const refreshRes = await fetch('/api/admin/beta/settings');
      const refreshData = await refreshRes.json();
      if (refreshData.capacity) {
        setCapacityInfo({ used: refreshData.capacity.used, pending: refreshData.capacity.pending_applications });
      }
    } catch (err: any) {
      setError('capacity', err.message);
      setSaveState('capacity', 'error');
    }
  };

  const saveDeadline = async () => {
    setSaveState('deadline', 'saving');
    setError('deadline', '');
    try {
      await patchSetting('founding_cohort_deadline', settings.founding_cohort_deadline);
      setSaveState('deadline', 'saved');
    } catch (err: any) {
      setError('deadline', err.message);
      setSaveState('deadline', 'error');
    }
  };

  const saveAutoApproval = async () => {
    setSaveState('autoApproval', 'saving');
    setError('autoApproval', '');
    try {
      await patchSetting('auto_approval_enabled', settings.auto_approval_enabled);
      await patchSetting('auto_approval_priority_threshold', settings.auto_approval_priority_threshold);
      setSaveState('autoApproval', 'saved');
    } catch (err: any) {
      setError('autoApproval', err.message);
      setSaveState('autoApproval', 'error');
    }
  };

  const savePhase = async () => {
    setSaveState('phase', 'saving');
    setError('phase', '');
    try {
      await patchSetting('beta_phase', settings.beta_phase);
      setSaveState('phase', 'saved');
    } catch (err: any) {
      setError('phase', err.message);
      setSaveState('phase', 'error');
    }
  };

  const saveWaitlist = async () => {
    setSaveState('waitlist', 'saving');
    setError('waitlist', '');
    try {
      await patchSetting('waitlist_message', settings.waitlist_message);
      setSaveState('waitlist', 'saved');
    } catch (err: any) {
      setError('waitlist', err.message);
      setSaveState('waitlist', 'error');
    }
  };

  const SaveButton = ({ section, onClick }: { section: SectionKey; onClick: () => void }) => {
    const state = saveStates[section];
    return (
      <Button
        variant="create"
        size="sm"
        onClick={onClick}
        disabled={state === 'saving'}
      >
        {state === 'saving' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
            Saving...
          </>
        ) : state === 'saved' ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Saved
          </>
        ) : (
          'Save'
        )}
      </Button>
    );
  };

  const ErrorMessage = ({ section }: { section: SectionKey }) => {
    const msg = errors[section];
    if (!msg) return null;
    return (
      <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-sm text-red-700 dark:text-red-300">{msg}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  const newEffective = settings.beta_capacity - settings.reserved_for_codes;
  const newAvailable = capacityInfo ? Math.max(0, newEffective - capacityInfo.used) : newEffective;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Capacity */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Capacity</h3>
            <p className="text-sm text-[var(--text-secondary)]">Total beta slots and reserved invite codes</p>
          </div>
          <SaveButton section="capacity" onClick={saveCapacity} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Total Capacity
            </label>
            <input
              type="number"
              value={settings.beta_capacity}
              onChange={(e) => setSettings(prev => ({ ...prev, beta_capacity: Math.max(1, parseInt(e.target.value) || 1) }))}
              min={1}
              max={10000}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Reserved for Codes
            </label>
            <input
              type="number"
              value={settings.reserved_for_codes}
              onChange={(e) => setSettings(prev => ({ ...prev, reserved_for_codes: Math.max(0, parseInt(e.target.value) || 0) }))}
              min={0}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
            />
          </div>
        </div>
        {/* Preview */}
        <div className="mt-4 p-3 bg-[var(--sand-2)] rounded-lg grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-tertiary)]">Effective:</span>
            <span className="ml-2 font-medium text-[var(--text-primary)]">{newEffective}</span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)]">Used:</span>
            <span className="ml-2 font-medium text-[var(--text-primary)]">{capacityInfo?.used ?? '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)]">Available:</span>
            <span className={`ml-2 font-medium ${newAvailable <= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {capacityInfo ? newAvailable : '—'}
            </span>
          </div>
        </div>
        <ErrorMessage section="capacity" />
      </div>

      {/* Founding Deadline */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Founding Cohort Deadline</h3>
            <p className="text-sm text-[var(--text-secondary)]">Cutoff date for founding member pricing</p>
          </div>
          <SaveButton section="deadline" onClick={saveDeadline} />
        </div>
        <input
          type="datetime-local"
          value={settings.founding_cohort_deadline ? settings.founding_cohort_deadline.slice(0, 16) : ''}
          onChange={(e) => setSettings(prev => ({ ...prev, founding_cohort_deadline: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
          className="w-full max-w-xs px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
        />
        {settings.founding_cohort_deadline && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            {new Date(settings.founding_cohort_deadline).toLocaleString()}
          </p>
        )}
        <ErrorMessage section="deadline" />
      </div>

      {/* Auto-Approval */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Auto-Approval</h3>
            <p className="text-sm text-[var(--text-secondary)]">Automatically approve high-priority applications</p>
          </div>
          <SaveButton section="autoApproval" onClick={saveAutoApproval} />
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={settings.auto_approval_enabled}
              onClick={() => setSettings(prev => ({ ...prev, auto_approval_enabled: !prev.auto_approval_enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.auto_approval_enabled
                  ? 'bg-[var(--teed-green-9)]'
                  : 'bg-[var(--sand-6)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.auto_approval_enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {settings.auto_approval_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
          {settings.auto_approval_enabled && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Minimum Priority Score
              </label>
              <input
                type="number"
                value={settings.auto_approval_priority_threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, auto_approval_priority_threshold: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                min={0}
                max={100}
                className="w-full max-w-[120px] px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Applications scoring at or above this threshold will be auto-approved
              </p>
            </div>
          )}
        </div>
        <ErrorMessage section="autoApproval" />
      </div>

      {/* Beta Phase */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Beta Phase</h3>
            <p className="text-sm text-[var(--text-secondary)]">Current stage of the beta program</p>
          </div>
          <SaveButton section="phase" onClick={savePhase} />
        </div>
        <div className="flex items-center gap-2">
          {(['founding', 'limited', 'open'] as const).map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, beta_phase: phase }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                settings.beta_phase === phase
                  ? 'bg-[var(--teed-green-9)] text-white'
                  : 'bg-[var(--sand-3)] text-[var(--text-secondary)] hover:bg-[var(--sand-4)]'
              }`}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </button>
          ))}
        </div>
        <ErrorMessage section="phase" />
      </div>

      {/* Waitlist Message */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Waitlist Message</h3>
            <p className="text-sm text-[var(--text-secondary)]">Shown to waitlisted applicants</p>
          </div>
          <SaveButton section="waitlist" onClick={saveWaitlist} />
        </div>
        <textarea
          value={settings.waitlist_message}
          onChange={(e) => setSettings(prev => ({ ...prev, waitlist_message: e.target.value }))}
          rows={4}
          placeholder="Thank you for your interest! We'll notify you when a spot opens up..."
          className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)] resize-y"
        />
        <ErrorMessage section="waitlist" />
      </div>
    </div>
  );
}
