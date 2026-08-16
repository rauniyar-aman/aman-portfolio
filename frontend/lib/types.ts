export const DEFAULT_THEME_COLOR = "#1F4E37";

export interface Passport {
  number: string;
  issued_by: string;
  issued_date: string;
  expiry_date: string;
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
  marital_status: string;
  address: string;
  passport: Passport;
  links: string[]; // e.g. LinkedIn, GitHub, Instagram, portfolio URLs
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: string[];
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

export const emptyCVContent = (): CVContent => ({
  full_name: "",
  email: "",
  phone: "",
  summary: "",
  dob: "",
  marital_status: "",
  address: "",
  passport: emptyPassport(),
  links: [],
  education: [],
  experience: [],
  skills: [],
  theme_color: DEFAULT_THEME_COLOR,
});
