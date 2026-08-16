"use client";

import { useState, type KeyboardEvent } from "react";

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillsInput({ skills, onChange }: SkillsInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const value = draft.trim().replace(/,+$/, "");
    if (value && !skills.includes(value)) {
      onChange([...skills, value]);
    }
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && draft === "" && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  }

  function removeSkill(skill: string) {
    onChange(skills.filter((s) => s !== skill));
  }

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-foreground/80"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="text-muted hover:text-foreground/80"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={skills.length === 0 ? "Type a skill and press Enter…" : ""}
          className="min-w-[8rem] flex-1 border-none bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>
    </div>
  );
}
