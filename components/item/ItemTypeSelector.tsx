'use client';

import { Package, Monitor, Cloud, Pill, Coffee, ChevronDown } from 'lucide-react';
import type { ItemType } from '@/lib/types/itemTypes';
import { ITEM_TYPE_REGISTRY } from '@/lib/itemTypes/registry';

interface ItemTypeSelectorProps {
  value: ItemType;
  onChange: (value: ItemType) => void;
  disabled?: boolean;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Package,
  Monitor,
  Cloud,
  Pill,
  Coffee,
};

export function ItemTypeSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: ItemTypeSelectorProps) {
  const selectedConfig = ITEM_TYPE_REGISTRY[value];
  const IconComponent = ICON_MAP[selectedConfig.icon] || Package;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        Item Type
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ItemType)}
          disabled={disabled}
          className="w-full appearance-none pl-10 pr-10 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {Object.values(ITEM_TYPE_REGISTRY).map((config) => (
            <option key={config.value} value={config.value}>
              {config.label}
            </option>
          ))}
        </select>

        {/* Icon on left */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Chevron on right */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Description */}
      <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
        {selectedConfig.description}
      </p>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function ItemTypeBadge({
  itemType,
  showLabel = true,
  size = 'sm',
}: {
  itemType: ItemType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  const config = ITEM_TYPE_REGISTRY[itemType];
  const IconComponent = ICON_MAP[config.icon] || Package;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  // Different colors for different types
  const colorClasses: Record<ItemType, string> = {
    physical_product: 'bg-[var(--sky-2)] text-[var(--sky-11)]',
    software: 'bg-[var(--teed-green-2)] text-[var(--teed-green-11)]',
    service: 'bg-[var(--copper-2)] text-[var(--copper-11)]',
    supplement: 'bg-[var(--amber-2)] text-[var(--amber-11)]',
    consumable: 'bg-[var(--sand-2)] text-[var(--sand-11)]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${colorClasses[itemType]}`}
    >
      <IconComponent className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export default ItemTypeSelector;
