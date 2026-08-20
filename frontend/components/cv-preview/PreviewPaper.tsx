import type { PreviewEducationRow } from "@/lib/cvPreviewModel";

export default function PreviewPaper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-sm border border-black/10 bg-white shadow-sm">
      <div className="aspect-[210/297] overflow-y-auto p-4 text-[6.3px] leading-[1.5] text-neutral-800">
        {children}
      </div>
    </div>
  );
}

export function PreviewSection({
  title,
  color,
  bold = true,
  uppercase = true,
  children,
}: {
  title: string;
  color: string;
  bold?: boolean;
  uppercase?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-[1.4em]">
      <p
        className={`border-b pb-[0.15em] text-[1.15em] ${bold ? "font-bold" : "font-medium"} ${
          uppercase ? "uppercase tracking-wide" : ""
        }`}
        style={{ color, borderColor: color }}
      >
        {title}
      </p>
      <div className="mt-[0.4em] space-y-[0.3em]">{children}</div>
    </div>
  );
}

// Always bold/capitalized regardless of the template's own section-heading
// convention (e.g. Minimalist's headings are normally font-normal) — the
// declaration heading is a fixed exception, not a themed section title. The
// line only appears when there's a date, so it's a separate element from
// the heading rather than a shared bottom-border like other sections use.
export function PreviewDeclarationSection({
  text,
  date,
  color,
}: {
  text: string;
  date: string;
  color: string;
}) {
  return (
    <div className="mt-[1.4em]">
      <div className="flex items-baseline gap-[0.6em]">
        <p className="whitespace-nowrap text-[1.15em] font-bold uppercase" style={{ color }}>
          Declaration:
        </p>
        {date && (
          <span
            className="flex-1 max-w-[10em] border-b pb-[0.1em] text-right text-[0.9em] text-neutral-500"
            style={{ borderColor: color }}
          >
            {date}
          </span>
        )}
      </div>
      <p className="mt-[0.4em] whitespace-pre-line">{text}</p>
    </div>
  );
}

const EDU_COLUMNS: { key: keyof PreviewEducationRow; label: string }[] = [
  { key: "degree", label: "Award" },
  { key: "institute", label: "Institute" },
  { key: "address", label: "Address" },
  { key: "percentage_grade", label: "Grade" },
  { key: "duration", label: "Duration" },
];

export function PreviewEducationTable({
  rows,
  color,
}: {
  rows: PreviewEducationRow[];
  color: string;
}) {
  // A column entirely blank across every entry (most often Address or
  // Grade) is dropped rather than rendered as a pointless empty column —
  // same rule build_cv_view_model/_add_education_table apply on the export
  // side, so what's shown while editing matches what actually exports.
  const columns = EDU_COLUMNS.filter((col) => rows.some((row) => row[col.key]));
  const visibleColumns = columns.length > 0 ? columns : EDU_COLUMNS;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {visibleColumns.map((col) => (
            <th
              key={col.key}
              className="px-[0.3em] py-[0.25em] text-left font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((edu, i) => (
          <tr key={i} className="border-b border-neutral-200">
            {visibleColumns.map((col) => (
              <td key={col.key} className="px-[0.3em] py-[0.25em] align-top">
                {edu[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
