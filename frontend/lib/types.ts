export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  summary: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

export interface CVContent {
  personal_info: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
}

export interface CV {
  id: number;
  title: string;
  content: CVContent;
  created_at: string;
  updated_at: string;
}

export const emptyCVContent = (): CVContent => ({
  personal_info: { name: "", email: "", phone: "", summary: "" },
  experience: [],
  education: [],
  skills: [],
});
