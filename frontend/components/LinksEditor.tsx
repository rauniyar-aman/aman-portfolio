"use client";

import { useState } from "react";

interface Preset {
  label: string;
  stub: string;
  // Domain fragment used to recognize this preset in a value that already
  // existed before this fix (e.g. a link saved on an older CV) — null for
  // presets with no reliable content signature (Portfolio can be any domain).
  matchDomain: string | null;
}

const PRESETS: Preset[] = [
  { label: "LinkedIn", stub: "linkedin.com/in/", matchDomain: "linkedin.com" },
  { label: "GitHub", stub: "github.com/", matchDomain: "github.com" },
  { label: "Instagram", stub: "instagram.com/", matchDomain: "instagram.com" },
  { label: "Portfolio", stub: "", matchDomain: null },
];

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-text focus:outline-none";

let nextEntryId = 0;
function makeEntryId(): string {
  nextEntryId += 1;
  return `link-${nextEntryId}`;
}

function inferPresetLabel(value: string): string | null {
  const lower = value.toLowerCase();
  return PRESETS.find((preset) => preset.matchDomain && lower.includes(preset.matchDomain))?.label ?? null;
}

interface LinkEntry {
  id: string;
  value: string;
  // Which preset button created this entry, if any — tracked by stable id
  // rather than array index so removing/reordering other entries can't
  // point this at the wrong one. Set once at creation (or inferred once
  // from the saved value on mount) and never re-derived from later edits,
  // so typing into a freeform "Other link" entry doesn't retroactively
  // adopt a preset.
  presetLabel: string | null;
}

export default function LinksEditor({
  links,
  onChange,
}: {
  links: string[];
  onChange: (links: string[]) => void;
}) {
  const [entries, setEntries] = useState<LinkEntry[]>(() =>
    links.map((value) => ({ id: makeEntryId(), value, presetLabel: inferPresetLabel(value) }))
  );

  function commit(next: LinkEntry[]) {
    setEntries(next);
    onChange(next.map((entry) => entry.value));
  }

  function updateLink(id: string, value: string) {
    commit(entries.map((entry) => (entry.id === id ? { ...entry, value } : entry)));
  }

  function removeLink(id: string) {
    commit(entries.filter((entry) => entry.id !== id));
  }

  function addLink(presetLabel: string | null, initialValue = "") {
    commit([...entries, { id: makeEntryId(), value: initialValue, presetLabel }]);
  }

  const usedPresetLabels = new Set(
    entries.map((entry) => entry.presetLabel).filter((label): label is string => label !== null)
  );

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          <input
            type="text"
            value={entry.value}
            onChange={(e) => updateLink(entry.id, e.target.value)}
            placeholder="e.g. linkedin.com/in/your-name"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => removeLink(entry.id)}
            className="shrink-0 text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {PRESETS.filter((preset) => !usedPresetLabels.has(preset.label)).map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => addLink(preset.label, preset.stub)}
            title={`Add a ${preset.label} link`}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-accent-text hover:text-accent-text"
          >
            + {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => addLink(null)}
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          + Other link
        </button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted">No links added yet.</p>
      )}
    </div>
  );
}
