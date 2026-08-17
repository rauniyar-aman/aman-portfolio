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
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {EDU_COLUMNS.map((col) => (
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
            {EDU_COLUMNS.map((col) => (
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
