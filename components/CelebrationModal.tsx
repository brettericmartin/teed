'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Crown, Twitter, Download, Copy, Check, Sparkles, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberNumber?: number;
  displayName?: string;
  handle?: string;
  tier?: string;
}

// Simple confetti effect
function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    delay: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const colors = [
      '#7A9770', // teed green
      '#CFE3E8', // sky
      '#F5D88A', // gold
      '#E8A87C', // copper
      '#98D1C8', // mint
    ];

    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 30,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: 8 + Math.random() * 8,
    }));

    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function CelebrationModal({
  isOpen,
  onClose,
  memberNumber = 43,
  displayName = 'Creator',
  handle = 'creator',
  tier = 'founder',
}: CelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Play celebration sound (optional)
      // new Audio('/sounds/celebration.mp3').play().catch(() => {});
    }
  }, [isOpen]);

  const shareText = `I just became Founding Member #${memberNumber} at @teed_club! The future of product curation is here. 🎯`;
  const shareUrl = `https://teed.club/u/${handle}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-white to-[var(--teed-green-1)] dark:from-zinc-900 dark:to-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-[var(--text-tertiary)]" />
        </button>

        {/* Top glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-radial from-amber-300/30 to-transparent blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative px-6 pt-12 pb-8 text-center">
          {/* Crown icon with glow */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-amber-400/50 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--teed-green-9)] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            You&apos;re In!
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-6">
            Welcome to the founding cohort, {displayName}!
          </p>

          {/* Member Card */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-[var(--border-subtle)] mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Founding Member
              </span>
            </div>

            <div className="text-5xl font-bold text-[var(--teed-green-9)] mb-1">
              #{memberNumber}
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              of 50 founding members
            </p>

            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {displayName}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">@{handle}</p>
            </div>

            <div className="mt-4 text-xs text-[var(--text-tertiary)]">
              Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Share buttons */}
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Share your achievement!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="create"
              onClick={handleShareTwitter}
              className="flex-1 gap-2"
            >
              <Twitter className="w-4 h-4" />
              Share on Twitter
            </Button>

            <Button
              variant="secondary"
              onClick={handleCopyLink}
              className="flex-1 gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Profile Link
                </>
              )}
            </Button>
          </div>

          {/* Continue button */}
          <button
            onClick={onClose}
            className="mt-6 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Start creating →
          </button>
        </div>
      </div>
    </div>
  );
}
