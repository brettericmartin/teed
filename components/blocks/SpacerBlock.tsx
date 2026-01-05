'use client';

import { SpacerBlockConfig } from '@/lib/blocks/types';

interface SpacerBlockProps {
  config: SpacerBlockConfig;
}

export default function SpacerBlock({ config }: SpacerBlockProps) {
  const { size = 'md' } = config;

  const sizeClasses = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  return <div className={sizeClasses[size]} aria-hidden="true" />;
}
