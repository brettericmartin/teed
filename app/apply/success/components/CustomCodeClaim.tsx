'use client';

import { useState } from 'react';
import { Check, Loader2, X, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CustomCodeClaimProps {
  applicationId: string;
  currentCode?: string | null;
  onCodeClaimed?: (code: string) => void;
}

/**
 * CustomCodeClaim
 *
 * Allows applicants to claim a memorable custom referral code
 * like "SARAH2024" instead of using their UUID.
 */
export default function CustomCodeClaim({
  applicationId,
  currentCode,
  onCodeClaimed,
}: CustomCodeClaimProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [availability, setAvailability] = useState<{
    available?: boolean;
    error?: string;
    normalized_code?: string;
  } | null>(null);
  const [claimedCode, setClaimedCode] = useState(currentCode);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://teed.club';
  const displayCode = claimedCode || applicationId;
  const referralLink = `${baseUrl}/apply?ref=${displayCode}`;

  const checkAvailability = async (codeToCheck: string) => {
    if (!codeToCheck || codeToCheck.length < 3) {
      setAvailability(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch(`/api/beta/applications/${applicationId}/referral-code`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToCheck }),
      });
      const data = await res.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailability({ available: false, error: 'Failed to check availability' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleClaim = async () => {
    if (!code || !availability?.available) return;

    setIsClaiming(true);
    setError(null);

    try {
      const res = await fetch(`/api/beta/applications/${applicationId}/referral-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        setClaimedCode(data.code);
        setIsEditing(false);
        onCodeClaimed?.(data.code);
      } else {
        setError(data.error || 'Failed to claim code');
      }
    } catch (err) {
      console.error('Error claiming code:', err);
      setError('Failed to claim code');
    } finally {
      setIsClaiming(false);
    }
  };

  // If they already have a custom code, just show it
  if (claimedCode && !isEditing) {
    return (
      <div className="bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--teed-green-9)]" />
          <span className="text-sm font-medium text-[var(--teed-green-11)]">
            Your custom referral code
          </span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-white dark:bg-black/20 rounded-lg font-mono text-lg font-bold text-[var(--teed-green-11)]">
            {claimedCode}
          </code>
        </div>
        <p className="text-xs text-[var(--teed-green-9)] mt-2">
          Share: {referralLink}
        </p>
      </div>
    );
  }

  // Show claim form
  if (isEditing) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-[var(--border-subtle)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Create your custom link
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-[var(--text-tertiary)]">
            {baseUrl.replace('https://', '')}/apply?ref=
          </span>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const newCode = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
              setCode(newCode);
              // Debounced availability check
              if (newCode.length >= 3) {
                checkAvailability(newCode);
              } else {
                setAvailability(null);
              }
            }}
            placeholder="YOURCODE"
            maxLength={20}
            className="flex-1 px-3 py-2 border border-[var(--border-subtle)] rounded-lg font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
          />
        </div>

        {/* Validation feedback */}
        {isChecking && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking...
          </div>
        )}

        {!isChecking && availability && (
          <div
            className={`flex items-center gap-2 text-sm mb-3 ${
              availability.available
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}
          >
            {availability.available ? (
              <>
                <Check className="w-4 h-4" />
                Available!
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                {availability.error}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Rules */}
        <ul className="text-xs text-[var(--text-tertiary)] mb-4 space-y-1">
          <li>• 3-20 characters</li>
          <li>• Letters, numbers, and underscores only</li>
          <li>• You can only set this once</li>
        </ul>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setCode('');
              setAvailability(null);
              setError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="create"
            size="sm"
            onClick={handleClaim}
            disabled={!code || !availability?.available || isClaiming}
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Claiming...
              </>
            ) : (
              'Claim Code'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Default: Show button to customize
  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-11)] hover:underline font-medium"
    >
      Customize your link
    </button>
  );
}
