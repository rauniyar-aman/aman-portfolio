"use client";

const PRESETS = [
  { name: "Dark Green", value: "#1F4E37" },
  { name: "Navy", value: "#1E3A5F" },
  { name: "Maroon", value: "#7A1F2B" },
  { name: "Charcoal", value: "#2E2E2E" },
  { name: "Teal", value: "#0F5C5C" },
  { name: "Plum", value: "#4A235A" },
];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export default function ThemeColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const swatchColor = HEX_PATTERN.test(value) ? value : "#1F4E37";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          title={preset.name}
          aria-label={preset.name}
          onClick={() => onChange(preset.value)}
          className={`h-8 w-8 rounded-full border-2 transition-transform ${
            value.toLowerCase() === preset.value.toLowerCase()
              ? "scale-110 border-foreground"
              : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: preset.value }}
        />
      ))}

      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
        <input
          type="color"
          value={swatchColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer border-none bg-transparent p-0"
          aria-label="Custom theme color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1F4E37"
          className="w-24 border-none bg-transparent text-sm text-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}
