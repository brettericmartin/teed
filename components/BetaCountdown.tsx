'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { BetaDeadline } from '@/lib/types/beta';

interface CountdownDisplayProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
}

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  isUrgent,
}: CountdownDisplayProps) {
  const unitClass = isUrgent
    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    : 'bg-[var(--teed-green-1)] dark:bg-zinc-800 text-[var(--text-primary)]';

  return (
    <div className="flex items-center justify-center gap-2">
      {days > 0 && (
        <>
          <div className={`px-3 py-2 rounded-lg ${unitClass}`}>
            <span className="text-2xl font-bold">{days}</span>
            <span className="text-xs ml-1 opacity-70">d</span>
          </div>
          <span className="text-[var(--text-tertiary)]">:</span>
        </>
      )}
      <div className={`px-3 py-2 rounded-lg ${unitClass}`}>
        <span className="text-2xl font-bold">{hours.toString().padStart(2, '0')}</span>
        <span className="text-xs ml-1 opacity-70">h</span>
      </div>
      <span className="text-[var(--text-tertiary)]">:</span>
      <div className={`px-3 py-2 rounded-lg ${unitClass}`}>
        <span className="text-2xl font-bold">{minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs ml-1 opacity-70">m</span>
      </div>
      <span className="text-[var(--text-tertiary)]">:</span>
      <div className={`px-3 py-2 rounded-lg ${unitClass}`}>
        <span className="text-2xl font-bold">{seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs ml-1 opacity-70">s</span>
      </div>
    </div>
  );
}

interface BetaCountdownProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
  onExpired?: () => void;
}

export default function BetaCountdown({
  className = '',
  showLabel = true,
  compact = false,
  onExpired,
}: BetaCountdownProps) {
  const [deadline, setDeadline] = useState<BetaDeadline | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch deadline from API
  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        const res = await fetch('/api/beta/deadline');
        const data = await res.json();
        setDeadline(data);
      } catch (err) {
        console.error('Failed to fetch deadline:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadline();
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (!deadline?.deadline) return;

    const targetDate = new Date(deadline.deadline).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onExpired?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  // Don't render if no deadline or loading
  if (loading || !deadline?.has_deadline) {
    return null;
  }

  // Don't render if expired
  if (deadline.is_expired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Founding cohort has closed</span>
        </div>
      </div>
    );
  }

  const isUrgent = deadline.is_urgent || timeLeft.days === 0;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isUrgent
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'bg-[var(--teed-green-1)] dark:bg-zinc-800 text-[var(--text-primary)]'
        } ${className}`}
      >
        {isUrgent && <AlertTriangle className="w-3.5 h-3.5" />}
        <Clock className="w-3.5 h-3.5" />
        <span>
          {timeLeft.days > 0
            ? `${timeLeft.days}d ${timeLeft.hours}h left`
            : `${timeLeft.hours}h ${timeLeft.minutes}m left`}
        </span>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-center gap-2 mb-3">
          {isUrgent && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          <span
            className={`text-sm font-medium ${
              isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-secondary)]'
            }`}
          >
            {isUrgent ? 'Founding cohort closing soon!' : 'Founding cohort closes in'}
          </span>
        </div>
      )}

      <CountdownDisplay
        days={timeLeft.days}
        hours={timeLeft.hours}
        minutes={timeLeft.minutes}
        seconds={timeLeft.seconds}
        isUrgent={isUrgent}
      />

      {isUrgent && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Apply now to secure your founding member spot
        </p>
      )}
    </div>
  );
}

// Badge version for navigation/header
export function BetaCountdownBadge({ className = '' }: { className?: string }) {
  return <BetaCountdown compact className={className} />;
}
