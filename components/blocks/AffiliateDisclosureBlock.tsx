'use client';

import { AffiliateDisclosureBlockConfig } from '@/lib/blocks/types';
import { Info } from 'lucide-react';

interface AffiliateDisclosureBlockProps {
  config: AffiliateDisclosureBlockConfig;
}

const DISCLOSURE_TEMPLATES: Record<'amazon' | 'general', string> = {
  amazon:
    'As an Amazon Associate, I earn from qualifying purchases. This means if you click a link and make a purchase, I may receive a small commission at no extra cost to you.',
  general:
    'Some links on this page are affiliate links. If you make a purchase through these links, I may earn a small commission at no additional cost to you.',
};

/**
 * Affiliate Disclosure Block
 * DOCTRINE: Professional legal infrastructure; transparent, not apologetic.
 */
export default function AffiliateDisclosureBlock({ config }: AffiliateDisclosureBlockProps) {
  const { disclosureType, customText, style = 'minimal' } = config;

  const text = disclosureType === 'custom' && customText
    ? customText
    : DISCLOSURE_TEMPLATES[disclosureType === 'custom' ? 'general' : disclosureType];

  const styleClasses = {
    minimal: 'text-xs text-[var(--text-tertiary)]',
    notice: 'text-xs text-[var(--text-secondary)] px-4 py-2.5 bg-[var(--sand-2)] border border-[var(--sand-6)] rounded-lg',
    card: 'text-sm text-[var(--text-secondary)] px-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
  };

  const iconClasses = {
    minimal: 'w-3.5 h-3.5 text-[var(--text-tertiary)]',
    notice: 'w-4 h-4 text-[var(--sand-9)]',
    card: 'w-4 h-4 text-[var(--text-secondary)]',
  };

  return (
    <div className="px-4 py-2 h-full flex flex-col justify-center">
      <div className={`flex items-start gap-2 ${styleClasses[style]}`}>
        <Info className={`flex-shrink-0 mt-0.5 ${iconClasses[style]}`} />
        <p className="leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
