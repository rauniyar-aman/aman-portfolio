"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiDelete, apiDownload, apiGet, ApiError, triggerBlobDownload } from "@/lib/api";
import type { CV } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CV[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadCvs = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<CV[]>("/cvs/");
      setCvs(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load CVs.");
    }
  }, [router]);

  useEffect(() => {
    loadCvs();
  }, [loadCvs]);

  async function handleDelete(cv: CV) {
    if (!confirm(`Delete "${cv.title}"? This cannot be undone.`)) return;
    setBusyId(cv.id);
    try {
      await apiDelete(`/cvs/${cv.id}/`);
      setCvs((prev) => prev?.filter((item) => item.id !== cv.id) ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not delete CV.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleExport(cv: CV, format: "pdf" | "docx") {
    setBusyId(cv.id);
    try {
      const { blob, filename } = await apiDownload(
        `/cvs/${cv.id}/export/${format}/`,
        `${cv.title || "cv"}.${format}`
      );
      triggerBlobDownload(blob, filename);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/cv-maker/login");
        return;
      }
      setError(err instanceof Error ? err.message : `Could not export ${format.toUpperCase()}.`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Your CVs</h1>
          <Link
            href="/cv-maker/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            + New CV
          </Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {cvs === null && !error && <p className="text-sm text-muted">Loading…</p>}

        {cvs !== null && cvs.length === 0 && (
          <p className="text-sm text-muted">
            You don&apos;t have any CVs yet. Create your first one to get started.
          </p>
        )}

        {cvs !== null && cvs.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {cvs.map((cv) => (
              <li key={cv.id} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{cv.title}</p>
                  <p className="text-xs text-muted">
                    Updated {new Date(cv.updated_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Link href={`/cv-maker/${cv.id}`} className="text-muted hover:text-foreground">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleExport(cv, "pdf")}
                    disabled={busyId === cv.id}
                    className="text-muted hover:text-foreground disabled:opacity-50"
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(cv, "docx")}
                    disabled={busyId === cv.id}
                    className="text-muted hover:text-foreground disabled:opacity-50"
                  >
                    Export DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cv)}
                    disabled={busyId === cv.id}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
