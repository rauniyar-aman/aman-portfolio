export const DEFAULT_THEME_COLOR = "#1F4E37";
export const DEFAULT_NATIONALITY = "Nepalese";
export const DEFAULT_COUNTRY = "Nepal";
export const DEFAULT_PHONE_COUNTRY_CODE = "+977";
export const MARITAL_STATUS_OPTIONS = ["Single", "Married"];

export type CVTemplate = "classic" | "modern" | "minimalist" | "academic";
export const DEFAULT_TEMPLATE: CVTemplate = "classic";

export const TEMPLATE_OPTIONS: { value: CVTemplate; label: string; description: string }[] = [
  {
    value: "classic",
    label: "Classic",
    description: "Detailed format for visa, university, and formal applications",
  },
  {
    value: "modern",
    label: "Modern",
    description: "Clean two-column layout for corporate and tech roles",
  },
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Simple, essentials-only format for quick applications",
  },
  {
    value: "academic",
    label: "Academic",
    description: "Education and publications-focused, for research roles",
  },
];

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

export interface ReferenceItem {
  name: string;
  position: string;
  company: string;
  phone: string;
  email: string;
}

export interface PublicationItem {
  title: string;
  venue: string;
  year: string;
}

export interface CVContent {
  full_name: string;
  email: string;
  phone: string;
  phone_country_code: string;
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
  references: ReferenceItem[]; // optional — omitted entirely from the CV if empty
  theme_color: string;
  template: CVTemplate;
  photo: string; // base64 data URI, optional — "" if not set
  languages: string[]; // just names, e.g. ["English", "Spanish"]
  publications: PublicationItem[]; // optional — used by the academic template
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

export const emptyReference = (): ReferenceItem => ({
  name: "",
  position: "",
  company: "",
  phone: "",
  email: "",
});

export const emptyPublication = (): PublicationItem => ({
  title: "",
  venue: "",
  year: "",
});

export const emptyCVContent = (): CVContent => ({
  full_name: "",
  email: "",
  phone: "",
  phone_country_code: DEFAULT_PHONE_COUNTRY_CODE,
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
  references: [],
  theme_color: DEFAULT_THEME_COLOR,
  template: DEFAULT_TEMPLATE,
  photo: "",
  languages: [],
  publications: [],
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

  const validTemplates = TEMPLATE_OPTIONS.map((t) => t.value);
  const template =
    typeof data.template === "string" && (validTemplates as string[]).includes(data.template)
      ? (data.template as CVTemplate)
      : base.template;

  const languages = Array.isArray(data.languages)
    ? data.languages.filter((l): l is string => typeof l === "string" && l.trim().length > 0)
    : base.languages;

  const publications = Array.isArray(data.publications)
    ? data.publications.map((p) => ({ ...emptyPublication(), ...((p as Partial<PublicationItem>) ?? {}) }))
    : base.publications;

  return {
    ...base,
    ...data,
    nationality: typeof data.nationality === "string" && data.nationality ? data.nationality : DEFAULT_NATIONALITY,
    marital_status:
      typeof data.marital_status === "string" ? data.marital_status.trim() : base.marital_status,
    phone_country_code:
      typeof data.phone_country_code === "string" && data.phone_country_code
        ? data.phone_country_code
        : base.phone_country_code,
    passport: { ...emptyPassport(), ...((data.passport as Partial<Passport>) ?? {}) },
    address,
    skills,
    template,
    photo: typeof data.photo === "string" ? data.photo : base.photo,
    languages,
    publications,
  } as CVContent;
}
