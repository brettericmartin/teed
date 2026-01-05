'use client';

import { DividerBlockConfig } from '@/lib/blocks/types';

interface DividerBlockProps {
  config: DividerBlockConfig;
}

export default function DividerBlock({ config }: DividerBlockProps) {
  const { style = 'solid', width = 'half' } = config;

  const styleClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
  };

  return (
    <div className="px-4 py-4 flex justify-center">
      <hr
        className={`
          ${widthClasses[width]}
          ${styleClasses[style]}
          border-t border-[var(--border-subtle)]
        `}
      />
    </div>
  );
}
