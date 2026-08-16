"use client";

// Stores dates as "mm/yyyy" strings (what the backend/export layout expects)
// while presenting a native browser month+year picker, which works in
// "yyyy-MM" values — this component converts between the two.

function toMonthInputValue(mmYyyy: string): string {
  const match = /^(\d{2})\/(\d{4})$/.exec(mmYyyy.trim());
  if (!match) return "";
  const [, mm, yyyy] = match;
  return `${yyyy}-${mm}`;
}

function fromMonthInputValue(yyyyMm: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!match) return "";
  const [, yyyy, mm] = match;
  return `${mm}/${yyyy}`;
}

interface MonthYearInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function MonthYearInput({
  value,
  onChange,
  disabled,
  className,
}: MonthYearInputProps) {
  return (
    <input
      type="month"
      value={toMonthInputValue(value)}
      onChange={(e) => onChange(fromMonthInputValue(e.target.value))}
      disabled={disabled}
      className={className}
    />
  );
}
