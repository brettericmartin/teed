'use client';

import { CustomTextBlockConfig } from '@/lib/blocks/types';

interface CustomTextBlockProps {
  config: CustomTextBlockConfig;
}

export default function CustomTextBlock({ config }: CustomTextBlockProps) {
  const { variant, text, alignment = 'left', size = 'md', fontWeight = 'normal', useSerifFont = false } = config;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  if (variant === 'heading') {
    const sizeClasses = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl sm:text-3xl',
      xl: 'text-3xl sm:text-4xl',
    };

    // Default heading to bold if no fontWeight specified (unless using serif)
    const headingWeight = useSerifFont
      ? 'header-display-serif'
      : (fontWeight === 'normal' ? 'font-bold' : fontWeightClasses[fontWeight]);

    return (
      <div className="px-4 py-4 h-full flex flex-col justify-center">
        <h2
          className={`
            ${sizeClasses[size] || sizeClasses.md}
            ${headingWeight}
            ${alignmentClasses[alignment]}
            text-[var(--theme-text,var(--text-primary))]
          `}
        >
          {text}
        </h2>
      </div>
    );
  }

  // Paragraph variant
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className="px-4 py-4 h-full flex flex-col justify-center">
      <p
        className={`
          ${sizeClasses[size] || sizeClasses.md}
          ${fontWeightClasses[fontWeight]}
          ${alignmentClasses[alignment]}
          text-[var(--theme-text-secondary,var(--text-secondary))]
          leading-relaxed
        `}
      >
        {text}
      </p>
    </div>
  );
}
