"use client";

import { X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value?: string[];
  selected?: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  helperText?: string;
  maxItems?: number;
  placeholder?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  selected,
  onChange,
  error,
  helperText,
  maxItems,
  placeholder = "Select options...",
}: MultiSelectProps) {
  // Support both 'value' and 'selected' props for flexibility
  const safeSelected = value || selected || [];

  const toggleOption = (optionValue: string) => {
    if (safeSelected.includes(optionValue)) {
      onChange(safeSelected.filter((s) => s !== optionValue));
    } else {
      if (maxItems && safeSelected.length >= maxItems) return;
      onChange([...safeSelected, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(safeSelected.filter((s) => s !== optionValue));
  };

  const getLabel = (val: string) => {
    const option = options.find((o) => o.value === val);
    return option?.label || val;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {maxItems && (
            <span className="text-slate-400 font-normal ml-2">
              ({safeSelected.length}/{maxItems})
            </span>
          )}
        </label>
      )}

      {/* Selected Tags */}
      {safeSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {safeSelected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {getLabel(item)}
              <button
                type="button"
                onClick={() => removeOption(item)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Options */}
      <div className="flex flex-wrap gap-2">
        {options
          .filter((opt) => !safeSelected.includes(opt.value))
          .map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              disabled={maxItems ? safeSelected.length >= maxItems : false}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${
                  maxItems && safeSelected.length >= maxItems
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }
              `}
            >
              {option.label}
            </button>
          ))}
      </div>

      {safeSelected.length === 0 && (
        <p className="text-sm text-slate-400 mt-2">{placeholder}</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-2 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

