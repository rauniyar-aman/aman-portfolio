"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import type { CV, CVContent, EducationItem, ExperienceItem } from "@/lib/types";
import { emptyCVContent } from "@/lib/types";
import SkillsInput from "@/components/SkillsInput";

interface CVFormProps {
  mode: "create" | "edit";
  cvId?: number;
  initialTitle?: string;
  initialContent?: CVContent;
}

function emptyExperience(): ExperienceItem {
  return { title: "", company: "", start_date: "", end_date: "", description: "" };
}

function emptyEducation(): EducationItem {
  return { degree: "", institution: "", year: "" };
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export default function CVForm({ mode, cvId, initialTitle, initialContent }: CVFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [content, setContent] = useState<CVContent>(initialContent ?? emptyCVContent());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [enhancingSummary, setEnhancingSummary] = useState(false);
  const [enhancingExpIndex, setEnhancingExpIndex] = useState<number | null>(null);

  const canEnhance = mode === "edit" && Boolean(cvId);

  function updatePersonalInfo(field: keyof CVContent["personal_info"], value: string) {
    setContent((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }));
  }

  function updateExperience(index: number, field: keyof ExperienceItem, value: string) {
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

  function updateEducation(index: number, field: keyof EducationItem, value: string) {
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

  function setSkills(skills: string[]) {
    setContent((prev) => ({ ...prev, skills }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      if (mode === "create") {
        const created = await apiPost<CV>("/cvs/", { title, content });
        router.push(`/cv-maker/${created.id}`);
        return;
      }

      await apiPut<CV>(`/cvs/${cvId}/`, { title, content });
      setSavedMessage("Saved.");
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

  async function handleEnhanceSummary() {
    if (!cvId) return;
    setEnhancingSummary(true);
    setError(null);

    const prompt = `Write a concise, professional 2-3 sentence CV summary for ${
      content.personal_info.name || "the candidate"
    }.${content.personal_info.summary ? ` Improve on this draft: "${content.personal_info.summary}"` : ""}`;

    try {
      const result = await apiPost<CV>(`/cvs/${cvId}/generate/`, { prompt });
      const generatedSummary = result.content?.personal_info?.summary;
      if (generatedSummary) {
        updatePersonalInfo("summary", generatedSummary);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : "AI enhancement failed.");
    } finally {
      setEnhancingSummary(false);
    }
  }

  async function handleEnhanceExperience(index: number) {
    if (!cvId) return;
    setEnhancingExpIndex(index);
    setError(null);

    const item = content.experience[index];
    const prompt = `Write a strong, achievement-focused 2-4 sentence CV description for the role of ${
      item.title || "this position"
    } at ${item.company || "the company"}.${
      item.description ? ` Improve on this draft: "${item.description}"` : ""
    }`;

    try {
      const result = await apiPost<CV>(`/cvs/${cvId}/generate/`, { prompt });
      const generatedDescription = result.content?.experience?.[0]?.description;
      if (generatedDescription) {
        updateExperience(index, "description", generatedDescription);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : "AI enhancement failed.");
    } finally {
      setEnhancingExpIndex(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <label htmlFor="cv-title" className="mb-1 block text-sm font-medium text-gray-700">
          CV title
        </label>
        <input
          id="cv-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Backend Engineer Resume"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      <Section title="Personal info">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              type="text"
              value={content.personal_info.name}
              onChange={(e) => updatePersonalInfo("name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={content.personal_info.email}
              onChange={(e) => updatePersonalInfo("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={content.personal_info.phone}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Summary"
          action={
            <EnhanceButton
              disabled={!canEnhance}
              loading={enhancingSummary}
              onClick={handleEnhanceSummary}
            />
          }
        >
          <textarea
            value={content.personal_info.summary}
            onChange={(e) => updatePersonalInfo("summary", e.target.value)}
            rows={4}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Experience" action={<AddButton onClick={addExperience} label="Add experience" />}>
        <div className="space-y-6">
          {content.experience.map((item, index) => (
            <div key={index} className="rounded-md border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Experience {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Role">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateExperience(index, "title", e.target.value)}
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
                <Field label="Start">
                  <input
                    type="text"
                    placeholder="e.g. Jan 2022"
                    value={item.start_date}
                    onChange={(e) => updateExperience(index, "start_date", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="End">
                  <input
                    type="text"
                    placeholder="e.g. Present"
                    value={item.end_date}
                    onChange={(e) => updateExperience(index, "end_date", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Description"
                action={
                  <EnhanceButton
                    disabled={!canEnhance}
                    loading={enhancingExpIndex === index}
                    onClick={() => handleEnhanceExperience(index)}
                  />
                }
              >
                <textarea
                  value={item.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Field>
            </div>
          ))}
          {content.experience.length === 0 && (
            <p className="text-sm text-gray-400">No experience added yet.</p>
          )}
        </div>
      </Section>

      <Section title="Education" action={<AddButton onClick={addEducation} label="Add education" />}>
        <div className="space-y-4">
          {content.education.map((item, index) => (
            <div key={index} className="rounded-md border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Education {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Degree">
                  <input
                    type="text"
                    value={item.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="School">
                  <input
                    type="text"
                    value={item.institution}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Year">
                  <input
                    type="text"
                    value={item.year}
                    onChange={(e) => updateEducation(index, "year", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
          {content.education.length === 0 && (
            <p className="text-sm text-gray-400">No education added yet.</p>
          )}
        </div>
      </Section>

      <Section title="Skills">
        <SkillsInput skills={content.skills} onChange={setSkills} />
      </Section>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {savedMessage && <p className="mb-4 text-sm text-green-600">{savedMessage}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !title}
        className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
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
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
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
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-gray-600 hover:text-gray-900"
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
      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:text-gray-300"
    >
      {loading ? "Enhancing…" : "✨ Enhance with AI"}
    </button>
  );
}
