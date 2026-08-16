import io

from django.template.loader import render_to_string
from docx import Document
from docx.shared import Pt


def render_cv_pdf(cv) -> bytes:
    # Imported lazily: WeasyPrint requires native GTK/Pango libraries that may
    # not be installed on every host, and we don't want that to break imports
    # for the rest of the API (see WeasyPrint's Windows install docs).
    from weasyprint import HTML

    html_string = render_to_string("cvs/cv_pdf.html", {"cv": cv, "content": cv.content or {}})
    return HTML(string=html_string).write_pdf()


def render_cv_docx(cv) -> bytes:
    content = cv.content or {}
    personal_info = content.get("personal_info", {}) or {}
    experience = content.get("experience", []) or []
    education = content.get("education", []) or []
    skills = content.get("skills", []) or []

    document = Document()

    document.add_heading(personal_info.get("name") or cv.title, level=0)

    contact_bits = [
        personal_info.get(field)
        for field in ("email", "phone", "location")
        if personal_info.get(field)
    ]
    if contact_bits:
        document.add_paragraph(" | ".join(contact_bits))

    if personal_info.get("summary"):
        document.add_heading("Summary", level=1)
        document.add_paragraph(personal_info["summary"])

    if experience:
        document.add_heading("Experience", level=1)
        for item in experience:
            heading = document.add_paragraph()
            run = heading.add_run(f"{item.get('title', '')} — {item.get('company', '')}")
            run.bold = True
            run.font.size = Pt(12)
            dates = " – ".join(
                d for d in (item.get("start_date"), item.get("end_date")) if d
            )
            if dates:
                document.add_paragraph(dates)
            if item.get("description"):
                document.add_paragraph(item["description"])

    if education:
        document.add_heading("Education", level=1)
        for item in education:
            heading = document.add_paragraph()
            run = heading.add_run(f"{item.get('degree', '')} — {item.get('institution', '')}")
            run.bold = True
            if item.get("year"):
                document.add_paragraph(item["year"])

    if skills:
        document.add_heading("Skills", level=1)
        document.add_paragraph(", ".join(skills))

    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()
