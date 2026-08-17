"use client";

import { TEMPLATE_OPTIONS, type CVTemplate } from "@/lib/types";

export default function TemplateStylePicker({
  value,
  onChange,
}: {
  value: CVTemplate;
  onChange: (template: CVTemplate) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {TEMPLATE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-md border p-3 text-left transition-colors ${
            value === option.value
              ? "border-accent-text bg-accent-soft"
              : "border-border hover:border-accent-text/50"
          }`}
        >
          <div className="text-sm font-semibold text-foreground">{option.label}</div>
          <div className="mt-0.5 text-xs text-muted">{option.description}</div>
        </button>
      ))}
    </div>
  );
}
