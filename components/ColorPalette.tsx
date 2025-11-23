'use client';

import Link from 'next/link';

/**
 * Color Palette Reference Component
 * Displays Teed brand colors in navigation for easy reference during development
 * Clickable to navigate to full design system showcase
 */
export function ColorPalette() {
  const colors = [
    { name: 'Earthy Sage', value: '#8BAA7E', var: '--teed-green-8' },
    { name: 'Deep Evergreen', value: '#1F3A2E', var: '--evergreen-12' },
    { name: 'Warm Sand', value: '#D9B47C', var: '--sand-8' },
    { name: 'Stone Grey', value: '#868996', var: '--grey-8' },
    { name: 'Sky Blue', value: '#CFE3E8', var: '--sky-5' },
    { name: 'Copper', value: '#C2784A', var: '--copper-8' },
  ];

  return (
    <Link
      href="/design-system"
      className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
      title="View full design system"
    >
      {colors.map((color) => (
        <div key={color.value} className="flex flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded-lg shadow-sm border border-[rgba(31,58,46,0.12)] group-hover:scale-110 transition-transform"
            style={{ backgroundColor: color.value }}
            title={`${color.name}: ${color.value}`}
          />
          <span className="text-[10px] text-[#868996] font-medium whitespace-nowrap">
            {color.name}
          </span>
        </div>
      ))}
    </Link>
  );
}
