"use client";

// Stores dates as "dd/mmm/yyyy" strings (e.g. "15/Jan/2020") while
// presenting a native browser date picker, which works in "yyyy-MM-dd"
// values — this component converts between the two.

export const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toDateInputValue(ddMmmYyyy: string): string {
  const match = /^(\d{2})\/([A-Za-z]{3})\/(\d{4})$/.exec(ddMmmYyyy.trim());
  if (!match) return "";
  const [, dd, mmmRaw, yyyy] = match;
  const monthIndex = MONTH_ABBR.findIndex((m) => m.toLowerCase() === mmmRaw.toLowerCase());
  if (monthIndex === -1) return "";
  const mm = String(monthIndex + 1).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromDateInputValue(yyyyMmDd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd);
  if (!match) return "";
  const [, yyyy, mm, dd] = match;
  const mmm = MONTH_ABBR[parseInt(mm, 10) - 1];
  if (!mmm) return "";
  return `${dd}/${mmm}/${yyyy}`;
}

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function DateInput({ value, onChange, disabled, className }: DateInputProps) {
  return (
    <input
      type="date"
      value={toDateInputValue(value)}
      onChange={(e) => onChange(fromDateInputValue(e.target.value))}
      disabled={disabled}
      className={className}
    />
  );
}
