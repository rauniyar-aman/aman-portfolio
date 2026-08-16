export const DEFAULT_THEME_COLOR = "#1F4E37";
export const DEFAULT_NATIONALITY = "Nepalese";
export const DEFAULT_COUNTRY = "Nepal";
export const MARITAL_STATUS_OPTIONS = ["Single", "Married"];

export interface Passport {
  number: string;
  issued_by: string;
  issued_date: string;
  expiry_date: string;
}

export interface Address {
  detail: string; // street, city, province, postal code, etc.
  country: string;
}

export interface EducationItem {
  degree: string;
  institute: string;
  address: string;
  percentage_grade: string;
  start_date: string; // mm/yyyy
  end_date: string; // mm/yyyy
}

export interface ExperienceItem {
  company: string;
  position: string;
  start_date: string; // mm/yyyy
  end_date_or_present: string; // mm/yyyy, or "Present"
  responsibilities: string[];
}

export interface CVContent {
  full_name: string;
  email: string;
  phone: string;
  summary: string;
  dob: string;
  nationality: string;
  marital_status: string;
  address: Address;
  passport: Passport;
  links: string[]; // e.g. LinkedIn, GitHub, Instagram, portfolio URLs
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: string; // free text — user writes it however they like
  theme_color: string;
}

export interface CV {
  id: number;
  title: string;
  content: CVContent;
  created_at: string;
  updated_at: string;
}

export const emptyPassport = (): Passport => ({
  number: "",
  issued_by: "",
  issued_date: "",
  expiry_date: "",
});

export const emptyAddress = (): Address => ({
  detail: "",
  country: DEFAULT_COUNTRY,
});

export const emptyCVContent = (): CVContent => ({
  full_name: "",
  email: "",
  phone: "",
  summary: "",
  dob: "",
  nationality: DEFAULT_NATIONALITY,
  marital_status: "",
  address: emptyAddress(),
  passport: emptyPassport(),
  links: [],
  education: [],
  experience: [],
  skills: "",
  theme_color: DEFAULT_THEME_COLOR,
});

/**
 * Fills in defaults for any fields missing from a CV fetched from the API,
 * and upgrades older shapes (address used to be a plain string; skills used
 * to be a string[]) to the current schema — so opening a CV saved before
 * one of those changes doesn't silently blank out or crash the form.
 */
export function normalizeCVContent(raw: unknown): CVContent {
  const base = emptyCVContent();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;

  const rawAddress = data.address;
  const address: Address =
    typeof rawAddress === "string"
      ? { detail: rawAddress, country: DEFAULT_COUNTRY }
      : { ...emptyAddress(), ...((rawAddress as Partial<Address>) ?? {}) };

  const rawSkills = data.skills;
  const skills = Array.isArray(rawSkills)
    ? rawSkills.filter((s): s is string => Boolean(s)).join("\n")
    : typeof rawSkills === "string"
      ? rawSkills
      : base.skills;

  return {
    ...base,
    ...data,
    nationality: typeof data.nationality === "string" && data.nationality ? data.nationality : DEFAULT_NATIONALITY,
    marital_status:
      typeof data.marital_status === "string" ? data.marital_status.trim() : base.marital_status,
    passport: { ...emptyPassport(), ...((data.passport as Partial<Passport>) ?? {}) },
    address,
    skills,
  } as CVContent;
}
