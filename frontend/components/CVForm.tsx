"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiDownload, apiPost, apiPut, ApiError, previewBlob, triggerBlobDownload } from "@/lib/api";
import type {
  Address,
  CV,
  CVContent,
  EducationItem,
  ExperienceItem,
  Passport,
  PublicationItem,
  ReferenceItem,
} from "@/lib/types";
import {
  emptyAddress,
  emptyCVContent,
  emptyPassport,
  emptyPublication,
  emptyReference,
  MARITAL_STATUS_OPTIONS,
} from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { COUNTRY_CODES, getCallingCodeForCountry } from "@/lib/countryCodes";
import { NATIONALITIES } from "@/lib/nationalities";
import CVPreviewPanel from "@/components/cv-preview/CVPreviewPanel";
import DateInput from "@/components/DateInput";
import LanguagesInput from "@/components/LanguagesInput";
import LinksEditor from "@/components/LinksEditor";
import MonthYearInput from "@/components/MonthYearInput";
import PhotoUpload from "@/components/PhotoUpload";
import TemplateStylePicker from "@/components/TemplateStylePicker";
import ThemeColorPicker from "@/components/ThemeColorPicker";

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
  const [previewing, setPreviewing] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "docx" | null>(null);

  const canEnhance = mode === "edit" && Boolean(cvId);

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

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      if (mode === "create") {
        const created = await apiPost<CV>("/cvs/", { title, content });
        initialSnapshotRef.current = JSON.stringify({ title, content });
        router.push(`/cv-maker/${created.id}`);
        return;
      }

      await apiPut<CV>(`/cvs/${cvId}/`, { title, content });
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
    if (!cvId) return;
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
      const result = await apiPost<{ summary: string }>(`/cvs/${cvId}/generate/`, {
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
    if (!cvId) return;
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
        `/cvs/${cvId}/generate/`,
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

  const passport = content.passport ?? emptyPassport();
  const address = content.address ?? emptyAddress();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="max-w-3xl">
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
              onChange={(e) => updateField("full_name", e.target.value)}
              className={inputClass}
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
                className={`${inputClass} w-24 shrink-0`}
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
            disabled={!canEnhance}
            loading={enhancingSummary}
            onClick={handleEnhanceSummary}
          />
        }
      >
        <textarea
          value={content.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          rows={4}
          className={inputClass}
        />
        {summaryEnhanceError && (
          <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{summaryEnhanceError}</p>
        )}
        <p className="mt-1.5 text-xs text-muted">
          AI-generated content should be reviewed for accuracy before submission, especially for
          visa or university applications.
        </p>
      </Section>

      <CollapsibleSection title="Additional Details (optional)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of Birth">
            <input
              type="date"
              value={content.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              className={inputClass}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Permanent Address">
            <textarea
              value={address.detail}
              onChange={(e) => updateAddress("detail", e.target.value)}
              rows={2}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Passport Number">
            <input
              type="text"
              value={passport.number}
              onChange={(e) => updatePassport("number", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Issued By">
            <input
              type="text"
              value={passport.issued_by}
              onChange={(e) => updatePassport("issued_by", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Issued Date">
            <DateInput
              value={passport.issued_date}
              onChange={(value) => updatePassport("issued_date", value)}
              className={inputClass}
            />
          </Field>
          <Field label="Expiry Date">
            <DateInput
              value={passport.expiry_date}
              onChange={(value) => updatePassport("expiry_date", value)}
              className={inputClass}
            />
          </Field>
        </div>
      </CollapsibleSection>

      <Section
        title="Education"
        action={<AddButton onClick={addEducation} label="Add education" />}
      >
        <div className="space-y-6">
          {content.education.map((item, index) => (
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
                  <MonthYearInput
                    value={item.end_date}
                    onChange={(value) => updateEducation(index, "end_date", value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
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
                      disabled={!canEnhance}
                      loading={enhancingExpIndex === index}
                      onClick={() => handleEnhanceExperience(index)}
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

      <Section title="Skills">
        <textarea
          value={content.skills}
          onChange={(e) => updateField("skills", e.target.value)}
          rows={4}
          placeholder="Write your skills however you like — one per line, comma-separated, or as a short paragraph."
          className={inputClass}
        />
      </Section>

      <Section title="Languages">
        <LanguagesInput
          value={content.languages}
          onChange={(languages) => updateField("languages", languages)}
        />
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

        {canEnhance && (
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
        <div className="sticky top-8">
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
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

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
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={disabled ? "Save the CV first to use AI enhance" : undefined}
      className="text-xs font-medium text-accent-text hover:text-accent-text/80 disabled:cursor-not-allowed disabled:text-muted/50"
    >
      {loading ? "Enhancing…" : "✨ Enhance with AI"}
    </button>
  );
}
