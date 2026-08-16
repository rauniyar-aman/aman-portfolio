"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CVForm from "@/components/CVForm";
import { apiGet, ApiError } from "@/lib/api";
import { normalizeCVContent } from "@/lib/types";
import type { CV } from "@/lib/types";

export default function EditCVPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cv, setCv] = useState<CV | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiGet<CV>(`/cvs/${id}/`)
      .then((data) => {
        if (!cancelled) setCv(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.push("/cv-maker/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load CV.");
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <div className="min-h-screen bg-background">
      {error && <p className="mx-auto max-w-3xl px-4 pt-6 text-sm text-red-700 dark:text-red-400">{error}</p>}
      {!cv && !error && (
        <p className="mx-auto max-w-3xl px-4 pt-6 text-sm text-muted">Loading…</p>
      )}
      {cv && (
        <CVForm
          mode="edit"
          cvId={cv.id}
          initialTitle={cv.title}
          initialContent={normalizeCVContent(cv.content)}
        />
      )}
    </div>
  );
}
