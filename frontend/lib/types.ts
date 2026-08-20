export const DEFAULT_THEME_COLOR = "#1F4E37";
export const DEFAULT_NATIONALITY = "Nepalese";
export const DEFAULT_COUNTRY = "Nepal";
export const DEFAULT_PHONE_COUNTRY_CODE = "+977";
export const MARITAL_STATUS_OPTIONS = ["Single", "Married"];
export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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

export type CVPurpose = "" | "job" | "foreign_employment" | "study_abroad" | "visa" | "academic";
export const DEFAULT_PURPOSE: CVPurpose = "";

export const PURPOSE_OPTIONS: {
  value: Exclude<CVPurpose, "">;
  label: string;
  description: string;
  defaultTemplate: CVTemplate;
}[] = [
  {
    value: "job",
    label: "Job Application",
    description: "General job applications, domestically or with a company",
    defaultTemplate: "modern",
  },
  {
    value: "foreign_employment",
    label: "Foreign Employment",
    description: "Applying for work abroad through a manpower/recruitment agency",
    defaultTemplate: "classic",
  },
  {
    value: "study_abroad",
    label: "University / Study Abroad",
    description: "Applying to a university or study-abroad program",
    defaultTemplate: "classic",
  },
  {
    value: "visa",
    label: "Visa Application",
    description: "Supporting document for a visa application",
    defaultTemplate: "classic",
  },
  {
    value: "academic",
    label: "Academic / Research",
    description: "Applying for research positions, PhD programs, or academic roles",
    defaultTemplate: "academic",
  },
];

export interface Passport {
  number: string;
  issued_by: string;
  issued_date: string;
  expiry_date: string;
  scan_image: string; // base64 data URI of the scanned bio-data page, "" if none
  scan_image_address: string; // base64 data URI of the scanned address page, "" if none
}

export interface Address {
  detail: string; // street, city, province, etc. — not the postal code
  postcode: string; // entered manually — never guessed by the passport scanner
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

export const LANGUAGE_PROFICIENCY_OPTIONS = ["Native", "Fluent", "Proficient", "Intermediate"];

export interface LanguageItem {
  language: string;
  proficiency: string; // one of LANGUAGE_PROFICIENCY_OPTIONS, or "" until chosen
}

// All optional — most relevant for the "Foreign Employment" purpose, but
// available regardless of purpose.
export interface PhysicalDetails {
  height: string;
  weight: string;
  blood_group: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
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
  languages: LanguageItem[];
  publications: PublicationItem[]; // optional — used by the academic template
  purpose: CVPurpose; // what the CV is for — only sets initial defaults, never restricts anything
  physical_details: PhysicalDetails; // optional, all fields
  emergency_contact: EmergencyContact; // optional, all fields
  preferred_position: string; // optional
  medical_fitness: string; // optional
  include_declaration: boolean; // checkbox — declaration only renders anywhere when true
  declaration_text: string; // pre-filled with a default the first time the box is ticked
  declaration_date: string; // optional — no line rendered next to the heading if blank
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
  scan_image: "",
  scan_image_address: "",
});

export const emptyAddress = (): Address => ({
  detail: "",
  postcode: "",
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

export const emptyLanguage = (): LanguageItem => ({
  language: "",
  proficiency: "",
});

export const emptyPhysicalDetails = (): PhysicalDetails => ({
  height: "",
  weight: "",
  blood_group: "",
});

export const emptyEmergencyContact = (): EmergencyContact => ({
  name: "",
  relationship: "",
  phone: "",
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
  purpose: DEFAULT_PURPOSE,
  physical_details: emptyPhysicalDetails(),
  emergency_contact: emptyEmergencyContact(),
  preferred_position: "",
  medical_fitness: "",
  include_declaration: false,
  declaration_text: "",
  declaration_date: "",
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
      ? { ...emptyAddress(), detail: rawAddress }
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

  // Languages used to be a plain string[] before proficiency levels were
  // added — migrate each old entry to { language, proficiency: "" } rather
  // than discarding it, so an existing CV doesn't lose data on load.
  const languages: LanguageItem[] = Array.isArray(data.languages)
    ? data.languages
        .map((l): LanguageItem | null => {
          if (typeof l === "string") {
            const language = l.trim();
            return language ? { language, proficiency: "" } : null;
          }
          if (l && typeof l === "object" && typeof (l as Partial<LanguageItem>).language === "string") {
            const language = (l as LanguageItem).language.trim();
            if (!language) return null;
            const proficiency = typeof (l as Partial<LanguageItem>).proficiency === "string"
              ? (l as LanguageItem).proficiency
              : "";
            return { language, proficiency };
          }
          return null;
        })
        .filter((l): l is LanguageItem => l !== null)
    : base.languages;

  const publications = Array.isArray(data.publications)
    ? data.publications.map((p) => ({ ...emptyPublication(), ...((p as Partial<PublicationItem>) ?? {}) }))
    : base.publications;

  const validPurposes = PURPOSE_OPTIONS.map((p) => p.value);
  const purpose: CVPurpose =
    typeof data.purpose === "string" && (validPurposes as string[]).includes(data.purpose)
      ? (data.purpose as CVPurpose)
      : base.purpose;

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
    purpose,
    physical_details: {
      ...emptyPhysicalDetails(),
      ...((data.physical_details as Partial<PhysicalDetails>) ?? {}),
    },
    emergency_contact: {
      ...emptyEmergencyContact(),
      ...((data.emergency_contact as Partial<EmergencyContact>) ?? {}),
    },
    preferred_position:
      typeof data.preferred_position === "string" ? data.preferred_position : base.preferred_position,
    medical_fitness: typeof data.medical_fitness === "string" ? data.medical_fitness : base.medical_fitness,
    include_declaration:
      typeof data.include_declaration === "boolean" ? data.include_declaration : base.include_declaration,
    declaration_text:
      typeof data.declaration_text === "string" ? data.declaration_text : base.declaration_text,
    declaration_date:
      typeof data.declaration_date === "string" ? data.declaration_date : base.declaration_date,
  } as CVContent;
}
