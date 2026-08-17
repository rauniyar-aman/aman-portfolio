"use client";

import { useMemo } from "react";
import type { CVContent } from "@/lib/types";
import { buildCVPreviewModel } from "@/lib/cvPreviewModel";
import PreviewPaper from "./PreviewPaper";
import ClassicPreview from "./ClassicPreview";
import ModernPreview from "./ModernPreview";
import MinimalistPreview from "./MinimalistPreview";
import AcademicPreview from "./AcademicPreview";

// Deliberately NOT pixel-identical to the real PDF/DOCX export — this is a
// fast, dependency-free approximation so the layout updates instantly as
// the user types, without a backend round-trip. Use "Preview" (further down
// the form, after saving) to see the exact WeasyPrint-rendered result.
export default function CVPreviewPanel({ content }: { content: CVContent }) {
  const vm = useMemo(() => buildCVPreviewModel(content), [content]);

  return (
    <div>
      <PreviewPaper>
        {content.template === "modern" && <ModernPreview vm={vm} />}
        {content.template === "minimalist" && <MinimalistPreview vm={vm} />}
        {content.template === "academic" && <AcademicPreview vm={vm} />}
        {(content.template === "classic" || !content.template) && <ClassicPreview vm={vm} />}
      </PreviewPaper>
      <p className="mt-2 text-center text-xs text-muted">
        Live preview — approximate. Save and use &quot;Preview&quot; below for the exact export.
      </p>
    </div>
  );
}
