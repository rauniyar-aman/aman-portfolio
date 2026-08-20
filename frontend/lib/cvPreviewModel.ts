import type { CVContent } from "@/lib/types";
import { DEFAULT_THEME_COLOR } from "@/lib/types";

/**
 * Frontend mirror of backend/cvs/exports.py's build_cv_view_model() — same
 * field derivation and section-omission rules, kept in sync by hand since
 * the live preview intentionally does NOT share code with the Django/
 * WeasyPrint export pipeline (see CVPreviewPanel for why: approximate
 * live preview vs. exact-match render are different design goals).
 */

export interface PreviewLinkItem {
  href: string;
  text: string;
}

export interface PreviewEducationRow {
  degree: string;
  institute: string;
  address: string;
  percentage_grade: string;
  duration: string;
}

export interface PreviewExperienceRow {
  company: string;
  position: string;
  tenure: string;
  responsibilities: string[];
}

export interface PreviewReferenceRow {
  name: string;
  position: string;
  company: string;
  phone: string;
  email: string;
}

export interface PreviewPublicationRow {
  title: string;
  venue: string;
  year: string;
}

export interface CVPreviewModel {
  themeColor: string;
  photo: string;
  fullName: string;
  address: string;
  phone: string;
  email: string;
  linkItems: PreviewLinkItem[];
  summary: string;
  personalRows: [string, string][];
  passportRows: [string, string][];
  physicalDetailsRows: [string, string][];
  emergencyContactRows: [string, string][];
  preferredPosition: string;
  medicalFitness: string;
  educationRows: PreviewEducationRow[];
  experienceRows: PreviewExperienceRow[];
  skills: string;
  referenceRows: PreviewReferenceRow[];
  languageLines: string[];
  publicationRows: PreviewPublicationRow[];
  includeDeclaration: boolean;
  declarationText: string;
  declarationDate: string;
}

function cleanLink(raw: string): PreviewLinkItem {
  const trimmed = raw.trim();
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const text = trimmed.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
  return { href, text };
}

function rows(pairs: [string, string | undefined][]): [string, string][] {
  return pairs.filter((pair): pair is [string, string] => Boolean(pair[1]));
}

export function buildCVPreviewModel(content: CVContent): CVPreviewModel {
  const themeColor = content.theme_color || DEFAULT_THEME_COLOR;

  const phone = content.phone ? `${content.phone_country_code} ${content.phone}`.trim() : "";

  const address = [content.address?.detail, content.address?.postcode, content.address?.country]
    .filter(Boolean)
    .join(", ");

  const personalRows = rows([
    ["Date of Birth", content.dob],
    ["Nationality", content.nationality],
    ["Marital Status", content.marital_status],
  ]);

  const linkItems = (content.links || []).filter((l) => l && l.trim()).map(cleanLink);

  const passportRows = rows([
    ["Passport Number", content.passport?.number],
    ["Issued By", content.passport?.issued_by],
    ["Issued Date", content.passport?.issued_date],
    ["Expiry Date", content.passport?.expiry_date],
  ]);

  const physicalDetailsRows = rows([
    ["Height", content.physical_details?.height],
    ["Weight", content.physical_details?.weight],
    ["Blood Group", content.physical_details?.blood_group],
  ]);

  const emergencyContactRows = rows([
    ["Name", content.emergency_contact?.name],
    ["Relationship", content.emergency_contact?.relationship],
    ["Phone", content.emergency_contact?.phone],
  ]);

  const educationRows: PreviewEducationRow[] = (content.education || []).map((item) => ({
    degree: item.degree,
    institute: item.institute,
    address: item.address,
    percentage_grade: item.percentage_grade,
    duration: [item.start_date, item.end_date].filter(Boolean).join(" - "),
  }));

  const experienceRows: PreviewExperienceRow[] = (content.experience || []).map((item) => ({
    company: item.company,
    position: item.position,
    tenure: [item.start_date, item.end_date_or_present].filter(Boolean).join(" – "),
    responsibilities: (item.responsibilities || []).filter(Boolean),
  }));

  const referenceRows: PreviewReferenceRow[] = (content.references || [])
    .filter((r) => r.name)
    .map((r) => ({ name: r.name, position: r.position, company: r.company, phone: r.phone, email: r.email }));

  const languageLines = (content.languages || [])
    .filter((item) => item.language.trim())
    .map((item) =>
      item.proficiency.trim() ? `${item.language.trim()} - ${item.proficiency.trim()}` : item.language.trim()
    );

  const publicationRows: PreviewPublicationRow[] = (content.publications || []).filter((p) => p.title);

  return {
    themeColor,
    photo: content.photo,
    fullName: content.full_name,
    address,
    phone,
    email: content.email,
    linkItems,
    summary: content.summary,
    personalRows,
    passportRows,
    physicalDetailsRows,
    emergencyContactRows,
    preferredPosition: content.preferred_position,
    medicalFitness: content.medical_fitness,
    educationRows,
    experienceRows,
    skills: content.skills,
    referenceRows,
    languageLines,
    publicationRows,
    includeDeclaration: Boolean(content.include_declaration),
    declarationText: content.declaration_text || "",
    declarationDate: content.declaration_date || "",
  };
}
