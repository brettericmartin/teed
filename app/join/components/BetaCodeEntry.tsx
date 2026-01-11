'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Check, X, Loader2 } from 'lucide-react';

export default function BetaCodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tier: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/beta/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json();

      if (result.valid) {
        setSuccess({ tier: result.tier });
        // Redirect to apply with the invite code
        setTimeout(() => {
          router.push(`/apply?ref=${encodeURIComponent(code.trim())}`);
        }, 1500);
      } else {
        setError(result.error || 'Invalid invite code');
      }
    } catch (err) {
      setError('Failed to validate code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-[var(--teed-green-9)] flex items-center justify-center mx-auto mb-2">
          <Check className="w-5 h-5 text-white" />
        </div>
        <p className="font-medium text-[var(--teed-green-11)]">
          Valid code! Redirecting to application...
        </p>
        <p className="text-sm text-[var(--teed-green-9)] mt-1">
          You'll join as a {success.tier} member
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter invite code (e.g., TEED-ABC123)"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          className="flex-1 text-center font-mono tracking-wider"
          disabled={isValidating}
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={isValidating || !code.trim()}
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Validate'
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </form>
  );
}
