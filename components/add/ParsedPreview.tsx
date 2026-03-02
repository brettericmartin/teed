'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ParsedTextResult } from '@/lib/textParsing';
import { cn } from '@/lib/utils';

interface ParsedPreviewProps {
  parsed: ParsedTextResult;
  onUpdateField?: (field: 'brand' | 'color' | 'productName', value: string) => void;
  onClearField?: (field: 'brand' | 'color' | 'productName') => void;
}

type ChipData = {
  label: string;
  value: string;
  field: 'brand' | 'color' | 'productName';
  chipColor: string;
  correction?: { original: string; corrected: string };
};

export default function ParsedPreview({ parsed, onUpdateField, onClearField }: ParsedPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Build chips from parsed result
  const chips: ChipData[] = [];

  if (parsed.brand) {
    const isFuzzy = !!parsed.fuzzyCorrection;
    chips.push({
      label: isFuzzy ? 'Suggested' : 'Brand',
      value: parsed.brand.value,
      field: 'brand',
      chipColor: isFuzzy
        ? 'bg-amber-50 text-amber-800 border-amber-300 border-dashed'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200',
      correction: parsed.fuzzyCorrection || undefined,
    });
  }

  if (parsed.productName) {
    chips.push({
      label: 'Product',
      value: parsed.productName.value,
      field: 'productName',
      chipColor: 'bg-blue-100 text-blue-800 border-blue-200',
    });
  }

  if (parsed.color) {
    chips.push({
      label: 'Color',
      value: parsed.color,
      field: 'color',
      chipColor: 'bg-pink-100 text-pink-800 border-pink-200',
    });
  }

  // Show spec badges (not editable, just informational)
  const specBadges = parsed.specifications.slice(0, 3);

  // Show category badge
  const categoryBadge = parsed.inferredCategory;

  if (chips.length === 0 && specBadges.length === 0 && !categoryBadge) {
    return null;
  }

  const handleStartEdit = (chip: ChipData) => {
    if (!onUpdateField) return;
    setEditingField(chip.field);
    setEditValue(chip.value);
  };

  const handleFinishEdit = (field: 'brand' | 'color' | 'productName') => {
    if (onUpdateField && editValue.trim()) {
      onUpdateField(field, editValue.trim());
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleClear = (e: React.MouseEvent, field: 'brand' | 'color' | 'productName') => {
    e.stopPropagation();
    onClearField?.(field);
  };

  return (
    <div className="flex flex-wrap gap-1.5 py-1.5">
      {chips.map((chip) => (
        <div key={chip.field} className="group relative">
          {editingField === chip.field ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleFinishEdit(chip.field)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEdit(chip.field);
                if (e.key === 'Escape') {
                  setEditingField(null);
                  setEditValue('');
                }
              }}
              autoFocus
              className="px-2 py-0.5 text-xs rounded-full border-2 border-blue-400 bg-white outline-none w-24"
            />
          ) : (
            <button
              type="button"
              onClick={() => handleStartEdit(chip)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors',
                chip.chipColor,
                onUpdateField && 'cursor-pointer hover:opacity-80'
              )}
              title={chip.correction
                ? `Corrected from "${chip.correction.original}" (tap to edit)`
                : onUpdateField ? 'Tap to edit' : undefined
              }
            >
              <span className="font-medium text-[10px] opacity-60">{chip.label}</span>
              <span>{chip.value}</span>
              {chip.correction && (
                <span className="text-[10px] opacity-50" title={`corrected from "${chip.correction.original}"`}>*</span>
              )}
              {onClearField && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleClear(e, chip.field)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onClearField(chip.field);
                    }
                  }}
                  className="ml-0.5 inline-flex items-center justify-center rounded-full hover:bg-black/10 p-0.5 transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          )}
        </div>
      ))}

      {specBadges.map((spec, i) => (
        <span
          key={`spec-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border bg-gray-100 text-gray-700 border-gray-200"
        >
          <span className="font-medium text-[10px] opacity-60">{spec.type}</span>
          <span>{spec.value}</span>
        </span>
      ))}

      {categoryBadge && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-gray-300 text-gray-600">
          <span className="font-medium text-[10px] opacity-60">Category</span>
          <span>{categoryBadge}</span>
        </span>
      )}
    </div>
  );
}
