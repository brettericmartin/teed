'use client';

import { useState } from 'react';
import type { ItemType } from '@/lib/types/itemTypes';
import {
  getFieldsForItemType,
  getGroupedFields,
  type FormField,
} from '@/lib/itemTypes/registry';

interface DynamicSpecsFormProps {
  itemType: ItemType;
  specs: Record<string, unknown>;
  onChange: (specs: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function DynamicSpecsForm({
  itemType,
  specs,
  onChange,
  disabled = false,
}: DynamicSpecsFormProps) {
  const groupedFields = getGroupedFields(itemType);
  const groups = Object.keys(groupedFields);

  // If no fields for this type, show nothing
  if (groups.length === 0) {
    return null;
  }

  const handleFieldChange = (key: string, value: unknown) => {
    onChange({
      ...specs,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {groups.map((groupName) => (
        <div key={groupName}>
          <h4 className="text-sm font-medium text-[var(--text-secondary)] capitalize mb-3">
            {groupName.replace(/_/g, ' ')}
          </h4>
          <div className="space-y-4">
            {groupedFields[groupName].map((field) => (
              <FormFieldRenderer
                key={field.key}
                field={field}
                value={specs[field.key]}
                onChange={(value) => handleFieldChange(field.key, value)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
}: FormFieldRendererProps) {
  const baseInputClasses =
    'w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
          {field.helpText && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.helpText}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            step="0.01"
            value={(value as number) || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
          {field.helpText && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.helpText}</p>
          )}
        </div>
      );

    case 'url':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
          {field.helpText && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.helpText}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
            className={baseInputClasses}
          />
          {field.helpText && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.helpText}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.helpText && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.helpText}</p>
          )}
        </div>
      );

    case 'multiselect':
      const selectedValues = (value as string[]) || [];
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onChange(selectedValues.filter((v) => v !== option.value));
                    } else {
                      onChange([...selectedValues, option.value]);
                    }
                  }}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[var(--teed-green-9)] text-white'
                      : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {field.helpText && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.helpText}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default DynamicSpecsForm;
