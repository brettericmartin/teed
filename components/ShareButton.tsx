'use client';

import { useState } from 'react';
import { Check, Copy, Linkedin } from 'lucide-react';

// Twitter/X icon (custom since lucide doesn't have the new X logo)
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface ShareButtonProps {
  platform: 'twitter' | 'linkedin' | 'copy';
  url: string;
  text?: string;
  title?: string;
  className?: string;
}

/**
 * ShareButton
 *
 * One-click sharing to social platforms with pre-filled copy.
 * Reduces friction for referral sharing.
 */
export default function ShareButton({
  platform,
  url,
  text,
  title,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        const tweetText = text || `Check out Teed - a new way to share your favorite products!\n\n${url}`;
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        break;

      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const getIcon = () => {
    switch (platform) {
      case 'twitter':
        return <TwitterIcon className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'copy':
        return copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (platform) {
      case 'twitter':
        return 'Tweet';
      case 'linkedin':
        return 'Share';
      case 'copy':
        return copied ? 'Copied!' : 'Copy Link';
    }
  };

  const getButtonStyle = () => {
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors';

    switch (platform) {
      case 'twitter':
        return `${base} bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200`;
      case 'linkedin':
        return `${base} bg-[#0A66C2] text-white hover:bg-[#004182]`;
      case 'copy':
        return copied
          ? `${base} bg-[var(--teed-green-9)] text-white`
          : `${base} bg-[var(--sand-3)] text-[var(--text-primary)] hover:bg-[var(--sand-4)]`;
    }
  };

  return (
    <button onClick={handleShare} className={`${getButtonStyle()} ${className}`}>
      {getIcon()}
      {getLabel()}
    </button>
  );
}

/**
 * ShareButtonGroup
 *
 * Pre-configured group of share buttons for referral sharing.
 */
export function ShareButtonGroup({
  referralLink,
  className = '',
}: {
  referralLink: string;
  className?: string;
}) {
  const twitterText = `Just applied to be a founding curator at Teed!\n\nThey're only accepting 50 creators. Use my link to skip the line:\n${referralLink}`;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <ShareButton
        platform="twitter"
        url={referralLink}
        text={twitterText}
      />
      <ShareButton
        platform="linkedin"
        url={referralLink}
        title="Join me on Teed.club"
      />
      <ShareButton platform="copy" url={referralLink} />
    </div>
  );
}
