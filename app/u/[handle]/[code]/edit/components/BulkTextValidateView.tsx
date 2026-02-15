'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import type { ProcessedTextItem } from '@/lib/types/bulkTextStream';

// ============================================================
// TYPES
// ============================================================

export interface ValidateItem {
  result: ProcessedTextItem;
  isSelected: boolean;
  confirmedName: string;
  confirmedBrand: string;
  confirmedDescription: string;
  confirmedCategory: string;
}

interface BulkTextValidateViewProps {
  items: ValidateItem[];
  onItemsChange: (items: ValidateItem[]) => void;
  onEnhance: () => void;
}

// ============================================================
// HELPERS
// ============================================================

function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.85) {
    return { label: 'Identified', colorClass: 'bg-green-100 text-green-700' };
  }
  if (confidence >= 0.70) {
    return { label: 'Best match', colorClass: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Review', colorClass: 'bg-amber-100 text-amber-700' };
}

// ============================================================
// SUGGESTION CHIP
// ============================================================

function SuggestionChip({
  suggestion,
  isActive,
  onClick,
}: {
  suggestion: { brand: string; productName: string; confidence: number; source: string };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
        ${isActive
          ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)] text-[var(--teed-green-11)] font-medium'
          : 'border-gray-200 bg-white text-gray-700 hover:border-[var(--sky-6)] hover:bg-[var(--sky-1)]'
        }
      `}
    >
      <span className="truncate max-w-[200px]">
        {suggestion.brand ? `${suggestion.brand} ` : ''}{suggestion.productName}
      </span>
      <span className="text-[10px] opacity-60">{Math.round(suggestion.confidence * 100)}%</span>
    </button>
  );
}

// ============================================================
// VALIDATE ITEM ROW
// ============================================================

function ValidateItemRow({
  item,
  index,
  onToggle,
  onChange,
}: {
  item: ValidateItem;
  index: number;
  onToggle: () => void;
  onChange: (updated: ValidateItem) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const badge = getConfidenceBadge(item.result.confidence);
  const hasAlternatives = item.result.suggestions.length > 1;

  const selectAlternative = (suggestion: ProcessedTextItem['suggestions'][0]) => {
    onChange({
      ...item,
      confirmedName: suggestion.productName,
      confirmedBrand: suggestion.brand,
      confirmedDescription: suggestion.description,
      confirmedCategory: suggestion.category,
      isSelected: true,
    });
  };

  return (
    <div
      className={`
        rounded-lg border p-3 transition-colors
        ${item.result.status === 'failed'
          ? 'border-red-200 bg-red-50 opacity-60'
          : item.isSelected
          ? 'border-[var(--teed-green-6)] bg-[var(--teed-green-1)]'
          : 'border-gray-200 bg-white'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          disabled={item.result.status === 'failed'}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            item.result.status === 'failed'
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
              : item.isSelected
              ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-9)]'
              : 'border-gray-300 bg-white hover:border-[var(--teed-green-6)]'
          }`}
        >
          {item.isSelected && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <div className="flex gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={item.confirmedBrand}
                  onChange={(e) => onChange({ ...item, confirmedBrand: e.target.value })}
                  placeholder="Brand"
                  className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                  autoFocus
                />
                <input
                  type="text"
                  value={item.confirmedName}
                  onChange={(e) => onChange({ ...item, confirmedName: e.target.value })}
                  placeholder="Product name"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[var(--sky-5)] focus:border-transparent"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-xs bg-[var(--teed-green-9)] text-white rounded hover:bg-[var(--teed-green-10)]"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium text-gray-900 truncate">
                  {item.confirmedBrand ? `${item.confirmedBrand} ` : ''}{item.confirmedName}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.colorClass}`}>
                  {badge.label}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  title="Edit name"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Original text */}
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.result.originalText}</p>

          {/* Alternatives toggle */}
          {hasAlternatives && item.result.confidence < 0.85 && !isEditing && (
            <div className="mt-2">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-xs text-[var(--sky-11)] hover:underline flex items-center gap-1"
              >
                {showAlternatives ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAlternatives ? 'Hide' : 'Show'} alternatives ({item.result.suggestions.length})
              </button>

              {showAlternatives && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.result.suggestions.map((suggestion, si) => {
                    const isActive =
                      suggestion.productName === item.confirmedName &&
                      suggestion.brand === item.confirmedBrand;
                    return (
                      <SuggestionChip
                        key={si}
                        suggestion={suggestion}
                        isActive={isActive}
                        onClick={() => selectAlternative(suggestion)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BulkTextValidateView({
  items,
  onItemsChange,
  onEnhance,
}: BulkTextValidateViewProps) {
  const selectedCount = items.filter(i => i.isSelected).length;
  const nonFailedCount = items.filter(i => i.result.status !== 'failed').length;
  const allSelected = selectedCount === nonFailedCount && nonFailedCount > 0;

  const toggleItem = (index: number) => {
    const next = [...items];
    next[index] = { ...next[index], isSelected: !next[index].isSelected };
    onItemsChange(next);
  };

  const updateItem = (index: number, updated: ValidateItem) => {
    const next = [...items];
    next[index] = updated;
    onItemsChange(next);
  };

  const toggleAll = () => {
    const newSelected = !allSelected;
    onItemsChange(
      items.map(item =>
        item.result.status === 'failed'
          ? item
          : { ...item, isSelected: newSelected }
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={toggleAll}
          className="text-sm text-[var(--sky-11)] hover:underline"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-sm text-gray-500">
          {selectedCount} of {items.length} selected
        </span>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.map((item, index) => (
          <ValidateItemRow
            key={index}
            item={item}
            index={index}
            onToggle={() => toggleItem(index)}
            onChange={(updated) => updateItem(index, updated)}
          />
        ))}
      </div>
    </div>
  );
}
