'use client';

import { BioBlockConfig } from '@/lib/blocks/types';

interface BioBlockProps {
  bio: string;
  config?: BioBlockConfig;
}

// Size-specific line clamp values
const SIZE_CONFIG = {
  compact: { lines: 'line-clamp-2', fontSize: 'text-sm' },
  standard: { lines: 'line-clamp-4', fontSize: 'text-base' },
  expanded: { lines: '', fontSize: 'text-base' }, // No truncation
};

export default function BioBlock({ bio, config = {} }: BioBlockProps) {
  const {
    show_full = false,
    size = 'standard',
    alignment = 'left',
    fontWeight = 'normal',
    showAccentBorder = true, // New: subtle accent border for visual interest
  } = config;

  if (!bio) {
    return null;
  }

  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.standard;

  // show_full overrides size truncation
  const lineClamp = show_full ? '' : sizeConfig.lines;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
  };

  // Use accent border for left-aligned text (looks best visually)
  const useAccentBorder = showAccentBorder && alignment === 'left';

  return (
    <div className="px-4 py-4 h-full flex flex-col justify-center">
      <div className={useAccentBorder ? 'bio-block-enhanced' : ''}>
        <p
          className={`
            ${sizeConfig.fontSize}
            ${alignmentClasses[alignment]}
            ${fontWeightClasses[fontWeight]}
            text-[var(--theme-text-secondary,var(--text-secondary))]
            leading-relaxed
            ${lineClamp}
          `}
        >
          {bio}
        </p>
      </div>
    </div>
  );
}
