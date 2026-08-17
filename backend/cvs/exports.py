import io
import os
import re
import sys

from django.template.loader import render_to_string
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

DEFAULT_THEME_COLOR = "#1F4E37"
DEFAULT_PHONE_COUNTRY_CODE = "+977"


def _rgb(hex_color: str) -> RGBColor:
    return RGBColor.from_string(hex_color.lstrip("#").upper())


def _clean_link(raw: str) -> dict:
    """Turn a user-entered URL (with or without a scheme) into a normalized
    href plus the bare "domain/path" text the CV should display, matching
    how contact links conventionally look on a printed CV.
    """
    raw = raw.strip()
    href = raw if re.match(r"^https?://", raw, re.IGNORECASE) else f"https://{raw}"
    text = re.sub(r"^https?://(www\.)?", "", raw, flags=re.IGNORECASE).rstrip("/")
    return {"href": href, "text": text}


def build_cv_view_model(cv) -> dict:
    """Shape a CV's raw JSON content into the exact fields/sections the PDF
    and DOCX exporters render, including which optional sections should be
    omitted. Shared by both exporters so their omission rules can't drift.
    """
    content = cv.content or {}
    theme_color = content.get("theme_color") or DEFAULT_THEME_COLOR

    full_name = content.get("full_name", "")
    email = content.get("email", "")
    phone = content.get("phone", "")
    phone_country_code = content.get("phone_country_code") or (
        DEFAULT_PHONE_COUNTRY_CODE if phone else ""
    )
    phone_display = f"{phone_country_code} {phone}".strip() if phone else ""
    summary = content.get("summary", "")
    dob = content.get("dob", "")
    nationality = content.get("nationality", "")
    marital_status = content.get("marital_status", "")
    passport = content.get("passport") or {}
    education = content.get("education") or []
    experience = content.get("experience") or []
    references = content.get("references") or []

    # Free text now — the user writes it however they like (one per line,
    # comma-separated, a short paragraph). Older CVs may still have it saved
    # as a list from before that change, so normalize either shape.
    raw_skills = content.get("skills") or ""
    skills = "\n".join(s for s in raw_skills if s) if isinstance(raw_skills, list) else raw_skills

    # Address used to be a plain string; it's now {detail, country} so the
    # country can be a dropdown. Older CVs may still have the plain-string
    # shape, so normalize both into one display string.
    raw_address = content.get("address") or ""
    if isinstance(raw_address, dict):
        address = ", ".join(
            part for part in (raw_address.get("detail", ""), raw_address.get("country", "")) if part
        )
    else:
        address = raw_address

    # Name, address, phone/email, and links all render in the header block
    # (see the reference layout), not as body sections — so Personal Details
    # only carries DOB/Nationality/Marital Status now.
    personal_rows = [
        row
        for row in (
            ("Date of Birth", dob),
            ("Nationality", nationality),
            ("Marital Status", marital_status),
        )
        if row[1]
    ]

    link_items = [_clean_link(link) for link in (content.get("links") or []) if link and link.strip()]

    passport_rows = [
        row
        for row in (
            ("Passport Number", passport.get("number", "")),
            ("Issued By", passport.get("issued_by", "")),
            ("Issued Date", passport.get("issued_date", "")),
            ("Expiry Date", passport.get("expiry_date", "")),
        )
        if row[1]
    ]

    education_rows = [
        {
            "degree": item.get("degree", ""),
            "institute": item.get("institute", ""),
            "address": item.get("address", ""),
            "percentage_grade": item.get("percentage_grade", ""),
            "duration": " - ".join(
                d for d in (item.get("start_date", ""), item.get("end_date", "")) if d
            ),
        }
        for item in education
    ]

    experience_rows = [
        {
            "company": item.get("company", ""),
            "position": item.get("position", ""),
            "tenure": " – ".join(
                d
                for d in (item.get("start_date", ""), item.get("end_date_or_present", ""))
                if d
            ),
            "responsibilities": [r for r in (item.get("responsibilities") or []) if r],
        }
        for item in experience
    ]

    # Omitted entirely (no heading, no rows) unless the user added at least
    # one — references are the one section that's genuinely optional on a CV.
    reference_rows = [
        {
            "name": item.get("name", ""),
            "position": item.get("position", ""),
            "company": item.get("company", ""),
            "phone": item.get("phone", ""),
            "email": item.get("email", ""),
        }
        for item in references
        if item.get("name")
    ]

    return {
        "theme_color": theme_color,
        "full_name": full_name,
        "address": address,
        "phone": phone_display,
        "email": email,
        "link_items": link_items,
        "summary": summary,
        "personal_rows": personal_rows,
        "passport_rows": passport_rows,
        "education_rows": education_rows,
        "experience_rows": experience_rows,
        "skills": skills,
        "reference_rows": reference_rows,
    }


_GTK_DLL_DIR_ADDED = False


def _ensure_windows_gtk_dll_dir():
    """WeasyPrint locates its native GTK/Pango DLLs via the process's DLL
    search path. On Windows, installers register the runtime's bin/ folder
    in the *system* PATH, but already-running processes (this one included,
    if it was started before the install, or a shell that hasn't been
    restarted since) never see that update — Windows doesn't broadcast PATH
    changes to running processes. Adding the known install directory
    explicitly here makes PDF export work regardless of when/how the
    process was started, instead of depending on a shell restart or reboot.
    """
    global _GTK_DLL_DIR_ADDED
    if _GTK_DLL_DIR_ADDED or sys.platform != "win32":
        return

    for candidate in (
        r"C:\Program Files\GTK3-Runtime Win64\bin",
        r"C:\Program Files (x86)\GTK3-Runtime Win64\bin",
    ):
        if os.path.isdir(candidate):
            if hasattr(os, "add_dll_directory"):
                os.add_dll_directory(candidate)
            os.environ["PATH"] = candidate + os.pathsep + os.environ.get("PATH", "")
            _GTK_DLL_DIR_ADDED = True
            return


def render_cv_pdf(cv) -> bytes:
    # Imported lazily: WeasyPrint requires native GTK/Pango libraries that may
    # not be installed on every host, and we don't want that to break imports
    # for the rest of the API (see WeasyPrint's Windows install docs).
    _ensure_windows_gtk_dll_dir()
    from weasyprint import HTML

    html_string = render_to_string("cvs/cv_pdf.html", build_cv_view_model(cv))
    return HTML(string=html_string).write_pdf()


def _add_bottom_border(paragraph, color_hex: str, size: int = 8):
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "2")
    bottom.set(qn("w:color"), color_hex.lstrip("#").upper())
    pBdr.append(bottom)
    pPr.append(pBdr)


def _add_hyperlink(paragraph, url: str, text: str, color_hex: str):
    """python-docx has no built-in hyperlink support; this is the standard
    OOXML recipe: register an external relationship, then build a
    <w:hyperlink> run pointing at it."""
    part = paragraph.part
    r_id = part.relate_to(url, RT.HYPERLINK, is_external=True)

    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)

    run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")

    color = OxmlElement("w:color")
    color.set(qn("w:val"), color_hex.lstrip("#").upper())
    rPr.append(color)

    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    rPr.append(underline)

    run.append(rPr)
    text_el = OxmlElement("w:t")
    text_el.text = text
    run.append(text_el)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def _set_cell_background(cell, color_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex.lstrip("#").upper())
    tcPr.append(shd)


def render_cv_docx(cv) -> bytes:
    vm = build_cv_view_model(cv)
    theme_color = vm["theme_color"]

    document = Document()

    section = document.sections[0]
    section.left_margin = Inches(0.5)
    section.right_margin = Inches(0.5)
    section.top_margin = Inches(0.5)
    section.bottom_margin = Inches(0.5)

    normal = document.styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(10)

    def add_section_heading(text):
        heading = document.add_paragraph()
        heading.paragraph_format.space_before = Pt(10)
        heading.paragraph_format.space_after = Pt(4)
        run = heading.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = _rgb(theme_color)
        _add_bottom_border(heading, theme_color)
        return heading

    def add_label_value_rows(rows):
        table = document.add_table(rows=0, cols=2)
        table.autofit = True
        for label, value in rows:
            row = table.add_row()
            label_cell, value_cell = row.cells
            label_run = label_cell.paragraphs[0].add_run(label)
            label_run.bold = True
            label_run.font.size = Pt(10)
            value_run = value_cell.paragraphs[0].add_run(value)
            value_run.font.size = Pt(10)

    def add_bullet(text):
        bullet = document.add_paragraph()
        bullet.paragraph_format.left_indent = Pt(18)
        bullet.paragraph_format.first_line_indent = Pt(-14)
        bullet.paragraph_format.space_after = Pt(2)
        bullet.add_run(f"•\t{text}")

    # --- Header: name, address, contact, links ----------------------------
    if vm["full_name"]:
        name_p = document.add_paragraph()
        name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        name_run = name_p.add_run(vm["full_name"])
        name_run.bold = True
        name_run.font.size = Pt(18)
        name_run.font.color.rgb = _rgb(theme_color)

    if vm["address"]:
        address_p = document.add_paragraph()
        address_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        address_p.paragraph_format.space_after = Pt(0)
        address_run = address_p.add_run(vm["address"])
        address_run.font.size = Pt(9.5)
        address_run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    if vm["phone"] or vm["email"]:
        contact_p = document.add_paragraph()
        contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact_p.paragraph_format.space_after = Pt(0)
        if vm["phone"]:
            contact_p.add_run(vm["phone"]).font.size = Pt(9.5)
        if vm["phone"] and vm["email"]:
            contact_p.add_run("   |   ").font.size = Pt(9.5)
        if vm["email"]:
            _add_hyperlink(contact_p, f"mailto:{vm['email']}", vm["email"], theme_color)

    if vm["link_items"]:
        links_p = document.add_paragraph()
        links_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for i, link in enumerate(vm["link_items"]):
            if i > 0:
                links_p.add_run("   |   ").font.size = Pt(9.5)
            _add_hyperlink(links_p, link["href"], link["text"], theme_color)

    rule = document.add_paragraph()
    rule.paragraph_format.space_before = Pt(6)
    rule.paragraph_format.space_after = Pt(4)
    _add_bottom_border(rule, theme_color, size=16)

    # --- Summary --------------------------------------------------------
    if vm["summary"]:
        add_section_heading("Summary")
        document.add_paragraph(vm["summary"])

    # --- Personal details (DOB / marital status only) ----------------------
    if vm["personal_rows"]:
        add_section_heading("Personal Details")
        add_label_value_rows(vm["personal_rows"])

    # --- Passport details ------------------------------------------------
    if vm["passport_rows"]:
        add_section_heading("Passport Details")
        add_label_value_rows(vm["passport_rows"])

    # --- Academic qualification --------------------------------------------
    if vm["education_rows"]:
        add_section_heading("Academic Qualification")
        headers = ["Award", "Institute", "Address", "Percentage/Grade", "Duration"]
        table = document.add_table(rows=1, cols=len(headers))
        table.autofit = True
        header_row = table.rows[0]
        for cell, header in zip(header_row.cells, headers):
            _set_cell_background(cell, theme_color)
            run = cell.paragraphs[0].add_run(header)
            run.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = _rgb("#FFFFFF")
        for edu in vm["education_rows"]:
            row = table.add_row()
            values = [
                edu["degree"],
                edu["institute"],
                edu["address"],
                edu["percentage_grade"],
                edu["duration"],
            ]
            for cell, value in zip(row.cells, values):
                run = cell.paragraphs[0].add_run(value)
                run.font.size = Pt(9.5)

    # --- Work experience -------------------------------------------------
    if vm["experience_rows"]:
        add_section_heading("Work Experience")
        for exp in vm["experience_rows"]:
            entry = document.add_paragraph()
            entry.paragraph_format.space_after = Pt(0)
            company_run = entry.add_run(exp["company"])
            company_run.bold = True

            if exp["position"]:
                position_p = document.add_paragraph()
                position_p.paragraph_format.space_after = Pt(0)
                position_run = position_p.add_run(exp["position"])
                position_run.italic = True

            if exp["tenure"]:
                tenure_p = document.add_paragraph()
                tenure_p.paragraph_format.space_after = Pt(2)
                tenure_run = tenure_p.add_run(f"Tenure: {exp['tenure']}")
                tenure_run.font.size = Pt(9)
                tenure_run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

            for bullet in exp["responsibilities"]:
                add_bullet(bullet)

    # --- Skills -----------------------------------------------------------
    if vm["skills"]:
        add_section_heading("Skills")
        for line in vm["skills"].split("\n"):
            document.add_paragraph(line)

    # --- References --------------------------------------------------------
    if vm["reference_rows"]:
        add_section_heading("References")
        for ref in vm["reference_rows"]:
            entry = document.add_paragraph()
            entry.paragraph_format.space_after = Pt(0)
            name_run = entry.add_run(ref["name"])
            name_run.bold = True

            role = " – ".join(part for part in (ref["position"], ref["company"]) if part)
            if role:
                role_p = document.add_paragraph()
                role_p.paragraph_format.space_after = Pt(0)
                role_p.add_run(role).italic = True

            contact = "   |   ".join(part for part in (ref["phone"], ref["email"]) if part)
            if contact:
                contact_p = document.add_paragraph()
                contact_p.paragraph_format.space_after = Pt(6)
                contact_run = contact_p.add_run(contact)
                contact_run.font.size = Pt(9)
                contact_run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()
