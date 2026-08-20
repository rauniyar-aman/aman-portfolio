"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiDownload, apiPost, apiPut, ApiError, previewBlob, triggerBlobDownload } from "@/lib/api";
import type {
  Address,
  CV,
  CVContent,
  CVPurpose,
  EducationItem,
  EmergencyContact,
  ExperienceItem,
  LanguageItem,
  Passport,
  PhysicalDetails,
  PublicationItem,
  ReferenceItem,
} from "@/lib/types";
import {
  BLOOD_GROUP_OPTIONS,
  emptyAddress,
  emptyCVContent,
  emptyEmergencyContact,
  emptyLanguage,
  emptyPassport,
  emptyPhysicalDetails,
  emptyPublication,
  emptyReference,
  LANGUAGE_PROFICIENCY_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PURPOSE_OPTIONS,
} from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { COUNTRY_CODES, getCallingCodeForCountry } from "@/lib/countryCodes";
import { NATIONALITIES } from "@/lib/nationalities";
import CVPreviewPanel from "@/components/cv-preview/CVPreviewPanel";
import DateInput, { MONTH_ABBR } from "@/components/DateInput";
import LinksEditor from "@/components/LinksEditor";
import MonthYearInput from "@/components/MonthYearInput";
import PassportPreviewPanel from "@/components/PassportPreviewPanel";
import PassportScanner, { PassportScanResult } from "@/components/PassportScanner";
import PhotoUpload from "@/components/PhotoUpload";
import PurposeSelector from "@/components/PurposeSelector";
import TemplateStylePicker from "@/components/TemplateStylePicker";
import ThemeColorPicker from "@/components/ThemeColorPicker";

// AI passport scan dates come back as "DD MMM YYYY" (e.g. "05 Jan 1998");
// convert to the native <input type="date"> format and to this form's
// "DD/Mmm/YYYY" passport-date convention (see DateInput.tsx).
function parseScanDate(ddMmmYyyy: string): { iso: string; slash: string } {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(ddMmmYyyy.trim());
  if (!match) return { iso: "", slash: "" };
  const [, dd, mmmRaw, yyyy] = match;
  const monthIndex = MONTH_ABBR.findIndex((m) => m.toLowerCase() === mmmRaw.toLowerCase());
  if (monthIndex === -1) return { iso: "", slash: "" };
  const ddPadded = dd.padStart(2, "0");
  const mm = String(monthIndex + 1).padStart(2, "0");
  return { iso: `${yyyy}-${mm}-${ddPadded}`, slash: `${ddPadded}/${MONTH_ABBR[monthIndex]}/${yyyy}` };
}

const DEFAULT_DECLARATION_TEXT =
  "I hereby declare that the details and information given above are complete and true to the best of my knowledge.";

interface CVFormProps {
  mode: "create" | "edit";
  cvId?: number;
  initialTitle?: string;
  initialContent?: CVContent;
}

function emptyExperience(): ExperienceItem {
  return {
    company: "",
    position: "",
    start_date: "",
    end_date_or_present: "",
    responsibilities: [],
  };
}

function emptyEducation(): EducationItem {
  return {
    degree: "",
    institute: "",
    address: "",
    percentage_grade: "",
    start_date: "",
    end_date: "",
  };
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-text focus:outline-none";

// Applied to fields a passport scan just filled in, while they still need
// the user's explicit confirmation against their physical passport.
const warningInputClass =
  "w-full rounded-md border-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-text focus:outline-none dark:bg-amber-950/30";

export default function CVForm({ mode, cvId, initialTitle, initialContent }: CVFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [content, setContent] = useState<CVContent>(initialContent ?? emptyCVContent());
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancingSummary, setEnhancingSummary] = useState(false);
  const [enhancingExpIndex, setEnhancingExpIndex] = useState<number | null>(null);
  const [summaryEnhanceError, setSummaryEnhanceError] = useState<string | null>(null);
  const [expEnhanceError, setExpEnhanceError] = useState<{ index: number; message: string } | null>(
    null
  );
  const [enhancingSkills, setEnhancingSkills] = useState(false);
  const [skillsEnhanceError, setSkillsEnhanceError] = useState<string | null>(null);
  const [skillsEnhanceNotice, setSkillsEnhanceNotice] = useState<string | null>(null);
  // Whether a passport scan has ever populated fields in this session, and
  // whether the user has since confirmed them against their physical
  // passport — resets to unverified on every new scan or edit of a
  // scan-affected field, per the verification safeguard.
  const [scanActive, setScanActive] = useState(false);
  const [scanVerified, setScanVerified] = useState(false);
  const [scanConfidence, setScanConfidence] = useState<{
    mrzRead: boolean;
    checksumsValid: boolean;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "docx" | null>(null);

  // Preview/export need a persisted CV to fetch a rendered file from;
  // AI generation only needs the in-memory form state, so it's not gated
  // on this.
  const canExport = mode === "edit" && Boolean(cvId);

  const hasEducationOrExperienceContent =
    content.education.some((e) => e.institute.trim() || e.degree.trim()) ||
    content.experience.some((e) => e.company.trim() || e.position.trim());

  const needsScanVerification = scanActive && !scanVerified;

  const initialSnapshotRef = useRef(
    JSON.stringify({ title: initialTitle ?? "", content: initialContent ?? emptyCVContent() })
  );
  const isDirtyRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = JSON.stringify({ title, content }) !== initialSnapshotRef.current;
  });

  // Full page unload — refresh, close tab, typed URL, external link.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // In-app navigation — Next's router does client-side transitions that
  // don't trigger beforeunload, so clicks on internal links (nav bar,
  // "Back to CVs", etc.) need their own guard. Runs in the capture phase so
  // it sees the click before the Link component's own handler does; only
  // cancelling (via stopPropagation) blocks the navigation — confirming
  // just lets the click carry on to Link as normal.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!isDirtyRef.current) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;

      const confirmed = window.confirm(
        "You have unsaved changes on this CV. Leave without saving?"
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  function updateField<K extends keyof CVContent>(field: K, value: CVContent[K]) {
    setContent((prev) => ({ ...prev, [field]: value }));
  }

  // Pre-fills the default declaration text only the first time the box is
  // ticked for a CV that doesn't have any text yet — an untick never clears
  // declaration_text, so a later re-tick restores whatever the user wrote
  // instead of silently overwriting it back to the default.
  function handleToggleDeclaration(checked: boolean) {
    setContent((prev) => ({
      ...prev,
      include_declaration: checked,
      declaration_text:
        checked && !prev.declaration_text.trim() ? DEFAULT_DECLARATION_TEXT : prev.declaration_text,
    }));
  }

  function updatePassport(field: keyof Passport, value: string) {
    setContent((prev) => ({
      ...prev,
      passport: { ...(prev.passport ?? emptyPassport()), [field]: value },
    }));
  }

  function updateAddress(field: keyof Address, value: string) {
    setContent((prev) => ({
      ...prev,
      address: { ...(prev.address ?? emptyAddress()), [field]: value },
    }));
  }

  // Editing a field that a passport scan filled in (Name, DOB, Address, or
  // any Passport Details field) means the user is actively reviewing it —
  // drop back to "needs verification" until they explicitly re-confirm.
  function resetScanVerification() {
    setScanVerified(false);
  }

  function updateFieldVerified<K extends keyof CVContent>(field: K, value: CVContent[K]) {
    updateField(field, value);
    resetScanVerification();
  }

  function updatePassportVerified(field: keyof Passport, value: string) {
    updatePassport(field, value);
    resetScanVerification();
  }

  function updateAddressDetailVerified(value: string) {
    updateAddress("detail", value);
    resetScanVerification();
  }

  function handlePassportImagesChange(bioImage: string, addressImage: string) {
    setContent((prev) => ({
      ...prev,
      passport: { ...(prev.passport ?? emptyPassport()), scan_image: bioImage, scan_image_address: addressImage },
    }));
  }

  function handlePassportScanResult(result: PassportScanResult) {
    const dob = parseScanDate(result.dob);
    const issued = parseScanDate(result.issued_date ?? "");
    const expiry = parseScanDate(result.expiry_date);

    setContent((prev) => ({
      ...prev,
      full_name: result.full_name || prev.full_name,
      dob: dob.iso || prev.dob,
      nationality: result.nationality || prev.nationality,
      passport: {
        ...(prev.passport ?? emptyPassport()),
        number: result.passport_number || prev.passport.number,
        issued_by: result.issuing_country || prev.passport.issued_by,
        issued_date: issued.slash || prev.passport.issued_date,
        expiry_date: expiry.slash || prev.passport.expiry_date,
      },
      address: result.permanent_address
        ? { ...(prev.address ?? emptyAddress()), detail: result.permanent_address }
        : prev.address,
    }));

    setScanActive(true);
    setScanVerified(false);
    setScanConfidence({ mrzRead: result.mrz_read, checksumsValid: result.checksums_valid });
  }

  // Sets a suggested template for the chosen purpose — a starting point
  // only. The Template Style Picker and Theme Color Picker below stay
  // fully interactive regardless of purpose; nothing here disables or
  // filters their options, so the user can immediately override this pick.
  function handlePurposeChange(purpose: Exclude<CVPurpose, "">) {
    const option = PURPOSE_OPTIONS.find((o) => o.value === purpose);
    setContent((prev) => ({
      ...prev,
      purpose,
      template: option?.defaultTemplate ?? prev.template,
    }));
  }

  function updatePhysicalDetails(field: keyof PhysicalDetails, value: string) {
    setContent((prev) => ({
      ...prev,
      physical_details: { ...(prev.physical_details ?? emptyPhysicalDetails()), [field]: value },
    }));
  }

  function updateEmergencyContact(field: keyof EmergencyContact, value: string) {
    setContent((prev) => ({
      ...prev,
      emergency_contact: { ...(prev.emergency_contact ?? emptyEmergencyContact()), [field]: value },
    }));
  }

  // Defaults the phone country code to match the selected address country —
  // still just a default, since a phone number's country and a mailing
  // address's country don't have to be the same; the code field stays
  // independently editable afterward.
  function handleAddressCountryChange(country: string) {
    setContent((prev) => ({
      ...prev,
      address: { ...(prev.address ?? emptyAddress()), country },
      phone_country_code: getCallingCodeForCountry(country),
    }));
  }

  function updateExperience<K extends keyof ExperienceItem>(
    index: number,
    field: K,
    value: ExperienceItem[K]
  ) {
    setContent((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addExperience() {
    setContent((prev) => ({ ...prev, experience: [...prev.experience, emptyExperience()] }));
  }

  function removeExperience(index: number) {
    setContent((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  }

  function updateEducation<K extends keyof EducationItem>(
    index: number,
    field: K,
    value: EducationItem[K]
  ) {
    setContent((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addEducation() {
    setContent((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }));
  }

  function removeEducation(index: number) {
    setContent((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  }

  function updateLanguage<K extends keyof LanguageItem>(
    index: number,
    field: K,
    value: LanguageItem[K]
  ) {
    setContent((prev) => ({
      ...prev,
      languages: prev.languages.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addLanguage() {
    setContent((prev) => ({ ...prev, languages: [...prev.languages, emptyLanguage()] }));
  }

  function removeLanguage(index: number) {
    setContent((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  }

  function updateReference<K extends keyof ReferenceItem>(
    index: number,
    field: K,
    value: ReferenceItem[K]
  ) {
    setContent((prev) => ({
      ...prev,
      references: prev.references.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addReference() {
    setContent((prev) => ({ ...prev, references: [...prev.references, emptyReference()] }));
  }

  function removeReference(index: number) {
    setContent((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  }

  function updatePublication<K extends keyof PublicationItem>(
    index: number,
    field: K,
    value: PublicationItem[K]
  ) {
    setContent((prev) => ({
      ...prev,
      publications: prev.publications.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addPublication() {
    setContent((prev) => ({ ...prev, publications: [...prev.publications, emptyPublication()] }));
  }

  function removePublication(index: number) {
    setContent((prev) => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index),
    }));
  }

  // The passport scanner's scan_image/scan_image_address are full base64
  // photos (several MB each) held only for the current session's Passport
  // Preview panel — they must never be persisted as part of CV.content, so
  // strip them from the outgoing payload without touching the local
  // `content` state the preview panel still reads from.
  function buildSavePayloadContent(): CVContent {
    if (!content.passport) return content;
    return {
      ...content,
      passport: { ...content.passport, scan_image: "", scan_image_address: "" },
    };
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payloadContent = buildSavePayloadContent();

      if (mode === "create") {
        const created = await apiPost<CV>("/cvs/", { title, content: payloadContent });
        initialSnapshotRef.current = JSON.stringify({ title, content });
        router.push(`/cv-maker/${created.id}`);
        return;
      }

      await apiPut<CV>(`/cvs/${cvId}/`, { title, content: payloadContent });
      initialSnapshotRef.current = JSON.stringify({ title, content });
      // Stay on the editor after saving an existing CV — instead of jumping
      // to the dashboard, this is where Preview/Export live so the user can
      // check the result before downloading anything.
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not save the CV.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    if (!cvId) return;
    setPreviewing(true);
    setError(null);

    try {
      const { blob } = await apiDownload(`/cvs/${cvId}/export/pdf`, `${title || "cv"}.pdf`);
      previewBlob(blob);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not generate preview.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleExport(format: "pdf" | "docx") {
    if (!cvId) return;
    setExportingFormat(format);
    setError(null);

    try {
      const { blob, filename } = await apiDownload(
        `/cvs/${cvId}/export/${format}`,
        `${title || "cv"}.${format}`
      );
      triggerBlobDownload(blob, filename);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : `Could not export ${format.toUpperCase()}.`);
    } finally {
      setExportingFormat(null);
    }
  }

  async function handleEnhanceSummary() {
    setEnhancingSummary(true);
    setSummaryEnhanceError(null);

    const prompt = JSON.stringify({
      full_name: content.full_name,
      dob: content.dob,
      marital_status: content.marital_status,
      address: content.address,
      education: content.education,
      experience: content.experience,
      skills: content.skills,
      existing_summary_draft: content.summary || null,
    });

    try {
      const result = await apiPost<{ summary: string }>(`/cvs/generate/`, {
        prompt,
        mode: "summary",
      });
      if (result.summary) {
        updateField("summary", result.summary);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setSummaryEnhanceError(err instanceof Error ? err.message : "AI enhancement failed.");
    } finally {
      setEnhancingSummary(false);
    }
  }

  async function handleEnhanceExperience(index: number) {
    setEnhancingExpIndex(index);
    setExpEnhanceError(null);

    const item = content.experience[index];
    const prompt = `Role: ${item.position || "this position"} at ${
      item.company || "the company"
    }.${
      item.responsibilities.length > 0
        ? ` Existing draft bullet points to improve on: ${item.responsibilities.join(" | ")}`
        : ""
    }`;

    try {
      const result = await apiPost<{ responsibilities: string[] }>(
        `/cvs/generate/`,
        { prompt, mode: "experience" }
      );
      if (result.responsibilities?.length) {
        updateExperience(index, "responsibilities", result.responsibilities);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setExpEnhanceError({
        index,
        message: err instanceof Error ? err.message : "AI enhancement failed.",
      });
    } finally {
      setEnhancingExpIndex(null);
    }
  }

  async function handleEnhanceSkills() {
    setEnhancingSkills(true);
    setSkillsEnhanceError(null);
    setSkillsEnhanceNotice(null);

    const existingSkills = content.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const prompt = JSON.stringify({
      education: content.education,
      experience: content.experience,
      existing_skills: existingSkills,
    });

    try {
      const result = await apiPost<{ skills: string[] }>(`/cvs/generate/`, {
        prompt,
        mode: "skills",
      });
      const suggestions = result.skills ?? [];
      if (existingSkills.length === 0) {
        updateField("skills", suggestions.join(", "));
      } else if (suggestions.length === 0) {
        setSkillsEnhanceNotice("Your skills list already looks comprehensive — no new suggestions");
      } else {
        updateField("skills", [...existingSkills, ...suggestions].join(", "));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setSkillsEnhanceError(err instanceof Error ? err.message : "AI enhancement failed.");
    } finally {
      setEnhancingSkills(false);
    }
  }

  const passport = content.passport ?? emptyPassport();
  const address = content.address ?? emptyAddress();
  const physicalDetails = content.physical_details ?? emptyPhysicalDetails();
  const emergencyContact = content.emergency_contact ?? emptyEmergencyContact();
  const hasPassportScan = Boolean(passport.scan_image || passport.scan_image_address);

  return (
    <div className="w-full px-[1cm] py-8">
      <div
        className={`mx-auto grid max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] ${
          hasPassportScan ? "xl:grid-cols-[320px_minmax(0,1fr)_380px]" : ""
        }`}
      >
      {hasPassportScan && (
        <div className="hidden xl:block">
          <div className="sticky top-20">
            <PassportPreviewPanel bioImage={passport.scan_image} addressImage={passport.scan_image_address} />
          </div>
        </div>
      )}
      <div>
      <Link
        href="/cv-maker/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        ← Back to CVs
      </Link>

      <div className="mb-6">
        <label htmlFor="cv-title" className="mb-1 block text-sm font-medium text-foreground/80">
          CV title
        </label>
        <input
          id="cv-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Backend Engineer Resume"
          className={inputClass}
        />
      </div>

      <Section title="Passport Scanner (optional)">
        <p className="mb-3 text-sm text-muted">
          Upload a photo of your passport to auto-fill your details.
        </p>
        <PassportScanner
          bioImage={passport.scan_image}
          addressImage={passport.scan_image_address}
          onImagesChange={handlePassportImagesChange}
          onScanResult={handlePassportScanResult}
        />
      </Section>

      {hasPassportScan && (
        <div className="mb-8 xl:hidden">
          <PassportPreviewPanel
            bioImage={passport.scan_image}
            addressImage={passport.scan_image_address}
            sticky={false}
          />
        </div>
      )}

      <Section title="What is this CV for?">
        <PurposeSelector value={content.purpose} onChange={handlePurposeChange} />
        <p className="mt-2 text-xs text-muted">
          This only sets a suggested template — you can change the template style or theme color
          below at any time.
        </p>
      </Section>

      <Section title="Photo">
        <PhotoUpload value={content.photo} onChange={(photo) => updateField("photo", photo)} />
      </Section>

      <Section title="Template style">
        <TemplateStylePicker
          value={content.template}
          onChange={(template) => updateField("template", template)}
        />
      </Section>

      <Section title="Theme color">
        <ThemeColorPicker
          value={content.theme_color}
          onChange={(color) => updateField("theme_color", color)}
        />
      </Section>

      <Section title="Basic info">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              type="text"
              value={content.full_name}
              onChange={(e) => updateFieldVerified("full_name", e.target.value)}
              className={needsScanVerification ? warningInputClass : inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={content.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <div className="flex items-center gap-2">
              <select
                value={content.phone_country_code}
                onChange={(e) => updateField("phone_country_code", e.target.value)}
                className={`${inputClass.replace("w-full ", "")} w-24 shrink-0`}
              >
                {COUNTRY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
                {content.phone_country_code && !COUNTRY_CODES.includes(content.phone_country_code) && (
                  <option value={content.phone_country_code}>{content.phone_country_code}</option>
                )}
              </select>
              <input
                type="text"
                value={content.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Links">
        <LinksEditor
          links={content.links}
          onChange={(links) => updateField("links", links)}
        />
      </Section>

      <Section
        title="Summary"
        action={
          <EnhanceButton
            disabled={!hasEducationOrExperienceContent}
            loading={enhancingSummary}
            onClick={handleEnhanceSummary}
            disabledTitle="Add your education or work experience first, then generate a summary with AI"
          />
        }
      >
        <textarea
          value={content.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          rows={4}
          placeholder="Write your own summary, or fill in your education and experience below, then click 'Enhance with AI' to generate one for you."
          className={`${inputClass} max-w-3xl text-justify`}
        />
        {summaryEnhanceError && (
          <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{summaryEnhanceError}</p>
        )}
        <p className="mt-1.5 text-xs text-muted">
          AI-generated content should be reviewed for accuracy before submission, especially for
          visa or university applications.
        </p>
      </Section>

      <CollapsibleSection title="Additional Details (optional)" forceOpen={scanActive}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of Birth">
            <input
              type="date"
              value={content.dob}
              onChange={(e) => updateFieldVerified("dob", e.target.value)}
              className={needsScanVerification ? warningInputClass : inputClass}
            />
          </Field>
          <Field label="Nationality">
            <select
              value={content.nationality}
              onChange={(e) => updateField("nationality", e.target.value)}
              className={inputClass}
            >
              {NATIONALITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {content.nationality && !NATIONALITIES.includes(content.nationality) && (
                <option value={content.nationality}>{content.nationality}</option>
              )}
            </select>
          </Field>
          <Field label="Marital Status">
            <select
              value={content.marital_status}
              onChange={(e) => updateField("marital_status", e.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {MARITAL_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {content.marital_status && !MARITAL_STATUS_OPTIONS.includes(content.marital_status) && (
                <option value={content.marital_status}>{content.marital_status}</option>
              )}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_160px]">
          <Field label="Permanent Address">
            <textarea
              value={address.detail}
              onChange={(e) => updateAddressDetailVerified(e.target.value)}
              rows={2}
              className={needsScanVerification && address.detail.trim() ? warningInputClass : inputClass}
            />
          </Field>
          <Field label="Postcode">
            <input
              type="text"
              value={address.postcode}
              onChange={(e) => updateAddress("postcode", e.target.value)}
              placeholder="Entered manually"
              className={inputClass}
            />
          </Field>
          <Field label="Country">
            <select
              value={address.country}
              onChange={(e) => handleAddressCountryChange(e.target.value)}
              className={inputClass}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted">
          Passport details
        </p>

        <div
          className={
            needsScanVerification
              ? "grid grid-cols-1 gap-4 rounded-md border-2 border-amber-500 bg-amber-50 p-3 sm:grid-cols-2 dark:bg-amber-950/30"
              : "grid grid-cols-1 gap-4 sm:grid-cols-2"
          }
        >
          <Field label="Passport Number">
            <input
              type="text"
              value={passport.number}
              onChange={(e) => updatePassportVerified("number", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Issued By">
            <input
              type="text"
              value={passport.issued_by}
              onChange={(e) => updatePassportVerified("issued_by", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Issued Date">
            <DateInput
              value={passport.issued_date}
              onChange={(value) => updatePassportVerified("issued_date", value)}
              className={inputClass}
            />
          </Field>
          <Field label="Expiry Date">
            <DateInput
              value={passport.expiry_date}
              onChange={(value) => updatePassportVerified("expiry_date", value)}
              className={inputClass}
            />
          </Field>
        </div>

        {scanActive && (
          <div className="mt-3">
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={scanVerified}
                onChange={(e) => setScanVerified(e.target.checked)}
                className="mt-0.5"
              />
              I have reviewed and confirmed these details match my passport
            </label>
            {!scanVerified && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                {scanConfidence && (!scanConfidence.mrzRead || !scanConfidence.checksumsValid)
                  ? "Could not fully verify this scan — please double-check all fields carefully."
                  : "Please compare these fields against your physical passport before saving — AI extraction can occasionally misread characters, especially on worn or low-quality scans."}
              </p>
            )}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Physical Details (optional)"
        forceOpen={content.purpose === "foreign_employment"}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Height">
            <input
              type="text"
              value={physicalDetails.height}
              onChange={(e) => updatePhysicalDetails("height", e.target.value)}
              placeholder="e.g. 170 cm"
              className={inputClass}
            />
          </Field>
          <Field label="Weight">
            <input
              type="text"
              value={physicalDetails.weight}
              onChange={(e) => updatePhysicalDetails("weight", e.target.value)}
              placeholder="e.g. 65 kg"
              className={inputClass}
            />
          </Field>
          <Field label="Blood Group">
            <select
              value={physicalDetails.blood_group}
              onChange={(e) => updatePhysicalDetails("blood_group", e.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {BLOOD_GROUP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Emergency Contact (optional)"
        forceOpen={content.purpose === "foreign_employment"}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name">
            <input
              type="text"
              value={emergencyContact.name}
              onChange={(e) => updateEmergencyContact("name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Relationship">
            <input
              type="text"
              value={emergencyContact.relationship}
              onChange={(e) => updateEmergencyContact("relationship", e.target.value)}
              placeholder="e.g. Father, Spouse"
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={emergencyContact.phone}
              onChange={(e) => updateEmergencyContact("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Preferred Position (optional)"
        forceOpen={content.purpose === "foreign_employment"}
      >
        <Field label="Preferred Position">
          <input
            type="text"
            value={content.preferred_position}
            onChange={(e) => updateField("preferred_position", e.target.value)}
            placeholder="e.g. Electrician, Housekeeping Supervisor"
            className={inputClass}
          />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection
        title="Medical Fitness Status (optional)"
        forceOpen={content.purpose === "foreign_employment"}
      >
        <Field label="Medical Fitness Status">
          <input
            type="text"
            value={content.medical_fitness}
            onChange={(e) => updateField("medical_fitness", e.target.value)}
            placeholder="e.g. Fit for overseas employment (GAMCA medical)"
            className={inputClass}
          />
        </Field>
      </CollapsibleSection>

      <Section
        title="Education"
        action={<AddButton onClick={addEducation} label="Add education" />}
      >
        <div className="space-y-6">
          {content.education.map((item, index) => {
            const isOngoing = item.end_date.trim().toLowerCase() === "present";
            return (
              <div key={index} className="rounded-md border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    Education {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Degree / Award">
                    <input
                      type="text"
                      value={item.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Institute">
                    <input
                      type="text"
                      value={item.institute}
                      onChange={(e) => updateEducation(index, "institute", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Institute Address">
                    <input
                      type="text"
                      value={item.address}
                      onChange={(e) => updateEducation(index, "address", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Percentage / Grade">
                    <input
                      type="text"
                      value={item.percentage_grade}
                      onChange={(e) => updateEducation(index, "percentage_grade", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Start Date">
                    <MonthYearInput
                      value={item.start_date}
                      onChange={(value) => updateEducation(index, "start_date", value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="End Date">
                    <div className="flex items-center gap-2">
                      <MonthYearInput
                        disabled={isOngoing}
                        value={isOngoing ? "" : item.end_date}
                        onChange={(value) => updateEducation(index, "end_date", value)}
                        className={`${inputClass} disabled:opacity-50`}
                      />
                      <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={isOngoing}
                          onChange={(e) =>
                            updateEducation(index, "end_date", e.target.checked ? "Present" : "")
                          }
                        />
                        Currently studying
                      </label>
                    </div>
                  </Field>
                </div>
              </div>
            );
          })}
          {content.education.length === 0 && (
            <p className="text-sm text-muted">No education added yet.</p>
          )}
        </div>
      </Section>

      <Section
        title="Experience"
        action={<AddButton onClick={addExperience} label="Add experience" />}
      >
        <div className="space-y-6">
          {content.experience.map((item, index) => {
            const isPresent = item.end_date_or_present.trim().toLowerCase() === "present";
            return (
              <div key={index} className="rounded-md border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    Experience {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Position">
                    <input
                      type="text"
                      value={item.position}
                      onChange={(e) => updateExperience(index, "position", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      type="text"
                      value={item.company}
                      onChange={(e) => updateExperience(index, "company", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Start Date">
                    <MonthYearInput
                      value={item.start_date}
                      onChange={(value) => updateExperience(index, "start_date", value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="End Date">
                    <div className="flex items-center gap-2">
                      <MonthYearInput
                        disabled={isPresent}
                        value={isPresent ? "" : item.end_date_or_present}
                        onChange={(value) =>
                          updateExperience(index, "end_date_or_present", value)
                        }
                        className={`${inputClass} disabled:opacity-50`}
                      />
                      <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={isPresent}
                          onChange={(e) =>
                            updateExperience(
                              index,
                              "end_date_or_present",
                              e.target.checked ? "Present" : ""
                            )
                          }
                        />
                        Till date
                      </label>
                    </div>
                  </Field>
                </div>

                <Field
                  label="Responsibilities"
                  action={
                    <EnhanceButton
                      disabled={!(item.company.trim() || item.position.trim())}
                      loading={enhancingExpIndex === index}
                      onClick={() => handleEnhanceExperience(index)}
                      disabledTitle="Add a company or position first, then generate bullet points with AI"
                    />
                  }
                >
                  <ResponsibilitiesEditor
                    items={item.responsibilities}
                    onChange={(responsibilities) =>
                      updateExperience(index, "responsibilities", responsibilities)
                    }
                  />
                  {expEnhanceError?.index === index && (
                    <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">
                      {expEnhanceError.message}
                    </p>
                  )}
                </Field>
              </div>
            );
          })}
          {content.experience.length === 0 && (
            <p className="text-sm text-muted">No experience added yet.</p>
          )}
        </div>
      </Section>

      <Section
        title="Skills"
        action={
          <EnhanceButton
            disabled={!hasEducationOrExperienceContent}
            loading={enhancingSkills}
            onClick={handleEnhanceSkills}
            label={content.skills.trim() ? "✨ Enhance Skills with AI" : "✨ Suggest Skills with AI"}
            loadingLabel={content.skills.trim() ? "Enhancing…" : "Suggesting…"}
            disabledTitle="Add your education or work experience first, then generate skill suggestions with AI"
          />
        }
      >
        <textarea
          value={content.skills}
          onChange={(e) => updateField("skills", e.target.value)}
          rows={4}
          placeholder="Write your skills however you like — one per line, comma-separated, or as a short paragraph."
          className={`${inputClass} max-w-3xl`}
        />
        {skillsEnhanceError && (
          <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{skillsEnhanceError}</p>
        )}
        {skillsEnhanceNotice && (
          <p className="mt-1.5 text-xs text-muted">{skillsEnhanceNotice}</p>
        )}
        <p className="mt-1.5 text-xs text-muted">
          AI-generated content should be reviewed for accuracy before submission, especially for
          visa or university applications.
        </p>
      </Section>

      <Section title="Languages" action={<AddButton onClick={addLanguage} label="Add language" />}>
        <div className="space-y-6">
          {content.languages.map((item, index) => (
            <div key={index} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Language {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Language">
                  <input
                    type="text"
                    value={item.language}
                    onChange={(e) => updateLanguage(index, "language", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Proficiency">
                  <select
                    value={item.proficiency}
                    onChange={(e) => updateLanguage(index, "proficiency", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {LANGUAGE_PROFICIENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ))}
          {content.languages.length === 0 && (
            <p className="text-sm text-muted">No languages added yet.</p>
          )}
        </div>
      </Section>

      {content.template === "academic" && (
        <Section
          title="Publications"
          action={<AddButton onClick={addPublication} label="Add publication" />}
        >
          <div className="space-y-6">
            <p className="text-sm text-muted">
              Shown on the Academic template only — optional otherwise.
            </p>
            {content.publications.map((item, index) => (
              <div key={index} className="rounded-md border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    Publication {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePublication(index)}
                    className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <Field label="Title">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updatePublication(index, "title", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Venue">
                    <input
                      type="text"
                      value={item.venue}
                      onChange={(e) => updatePublication(index, "venue", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Year">
                    <input
                      type="text"
                      value={item.year}
                      onChange={(e) => updatePublication(index, "year", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {content.publications.length === 0 && (
              <p className="text-sm text-muted">No publications added yet.</p>
            )}
          </div>
        </Section>
      )}

      <Section
        title="References"
        action={<AddButton onClick={addReference} label="Add reference" />}
      >
        <div className="space-y-6">
          <p className="text-sm text-muted">
            Optional — only shown on the CV if you add at least one.
          </p>
          {content.references.map((item, index) => (
            <div key={index} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Reference {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeReference(index)}
                  className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateReference(index, "name", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Position">
                  <input
                    type="text"
                    value={item.position}
                    onChange={(e) => updateReference(index, "position", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Company">
                  <input
                    type="text"
                    value={item.company}
                    onChange={(e) => updateReference(index, "company", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="text"
                    value={item.phone}
                    onChange={(e) => updateReference(index, "phone", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={item.email}
                    onChange={(e) => updateReference(index, "email", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
          {content.references.length === 0 && (
            <p className="text-sm text-muted">No references added yet.</p>
          )}
        </div>
      </Section>

      <Section title="Declaration">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={content.include_declaration}
            onChange={(e) => handleToggleDeclaration(e.target.checked)}
          />
          Include declaration statement
        </label>

        {content.include_declaration && (
          <div className="mt-4 space-y-4">
            <Field label="Declaration Text">
              <textarea
                value={content.declaration_text}
                onChange={(e) => updateField("declaration_text", e.target.value)}
                rows={3}
                className={`${inputClass} max-w-3xl`}
              />
            </Field>
            <Field label="Date (optional)">
              <input
                type="text"
                value={content.declaration_date}
                onChange={(e) => updateField("declaration_date", e.target.value)}
                placeholder="e.g. 20 Aug 2026"
                className={`${inputClass} max-w-xs`}
              />
            </Field>
          </div>
        )}
      </Section>

      {error && <p className="mb-4 text-sm text-red-700 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>

        {canExport && (
          <>
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              title="Opens a PDF preview in a new tab so you can check it before downloading"
              className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent-text hover:text-accent-text disabled:opacity-50"
            >
              {previewing ? "Preparing preview…" : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={exportingFormat !== null}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent-text hover:text-accent-text disabled:opacity-50"
            >
              {exportingFormat === "pdf" ? "Exporting…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={() => handleExport("docx")}
              disabled={exportingFormat !== null}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent-text hover:text-accent-text disabled:opacity-50"
            >
              {exportingFormat === "docx" ? "Exporting…" : "Download DOCX"}
            </button>
          </>
        )}

        {justSaved && <span className="text-sm text-muted">Saved ✓ — preview it before you download.</span>}
      </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20">
          <CVPreviewPanel content={content} />
        </div>
      </div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
  forceOpen,
}: {
  title: string;
  children: React.ReactNode;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Nudge the section open once when forceOpen turns true (e.g. a passport
  // scan just filled in fields that live inside it) — the user can still
  // collapse it again afterward.
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div className="mb-8 rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground/80">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function ResponsibilitiesEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  function updateBullet(index: number, value: string) {
    onChange(items.map((bullet, i) => (i === index ? value : bullet)));
  }

  function removeBullet(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addBullet() {
    onChange([...items, ""]);
  }

  return (
    <div className="space-y-2">
      {items.map((bullet, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="shrink-0 text-muted">•</span>
          <input
            type="text"
            value={bullet}
            onChange={(e) => updateBullet(index, e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => removeBullet(index)}
            className="shrink-0 text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addBullet}
        className="text-sm font-medium text-muted hover:text-foreground"
      >
        + Add bullet point
      </button>
      {items.length === 0 && (
        <p className="text-sm text-muted">No responsibilities added yet.</p>
      )}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-muted hover:text-foreground"
    >
      + {label}
    </button>
  );
}

function EnhanceButton({
  onClick,
  disabled,
  loading,
  label = "✨ Enhance with AI",
  loadingLabel = "Enhancing…",
  disabledTitle,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label?: string;
  loadingLabel?: string;
  disabledTitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={disabled ? disabledTitle : undefined}
      className="text-xs font-medium text-accent-text hover:text-accent-text/80 disabled:cursor-not-allowed disabled:text-muted/50"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
