"use client";

const PRESETS = [
  { label: "LinkedIn", stub: "linkedin.com/in/" },
  { label: "GitHub", stub: "github.com/" },
  { label: "Instagram", stub: "instagram.com/" },
  { label: "Portfolio", stub: "" },
];

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-text focus:outline-none";

export default function LinksEditor({
  links,
  onChange,
}: {
  links: string[];
  onChange: (links: string[]) => void;
}) {
  function updateLink(index: number, value: string) {
    onChange(links.map((link, i) => (i === index ? value : link)));
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function addLink() {
    onChange([...links, ""]);
  }

  return (
    <div className="space-y-2">
      {links.map((link, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={link}
            onChange={(e) => updateLink(index, e.target.value)}
            placeholder="e.g. linkedin.com/in/your-name"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => removeLink(index)}
            className="shrink-0 text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange([...links, preset.stub])}
            title={`Add a ${preset.label} link`}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-accent-text hover:text-accent-text"
          >
            + {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={addLink}
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          + Other link
        </button>
      </div>

      {links.length === 0 && (
        <p className="text-sm text-muted">No links added yet.</p>
      )}
    </div>
  );
}
