"use client";

import { useState } from "react";

export default function LanguagesInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (languages: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    setDraft("");
    if (!trimmed) return;
    if (value.some((lang) => lang.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeLanguage(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        {value.map((lang, index) => (
          <button
            key={`${lang}-${index}`}
            type="button"
            onClick={() => removeLanguage(index)}
            title={`Remove ${lang}`}
            className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-text"
          >
            {lang}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? "Type a language and press Enter" : "Add another…"}
          className="min-w-[140px] flex-1 border-none bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">Press Enter or comma to add, click a chip to remove it.</p>
    </div>
  );
}
