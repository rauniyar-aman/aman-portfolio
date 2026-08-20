import json
import logging
import random
import time

import google.generativeai as genai
from django.conf import settings
from google.api_core import exceptions as google_exceptions

from .mrz import validate_td3_mrz

logger = logging.getLogger(__name__)

# "Retry up to 3 times" = 3 retries after the first attempt (4 tries total),
# waiting 1s, then 2s, then 4s between them, per the exponential backoff.
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1
RATE_LIMIT_MESSAGE = (
    "Our AI assistant is a bit busy right now — please wait a moment and try again."
)

# "gemini-2.0-flash" (the version originally specified) has been retired by
# Google. "gemini-flash-latest" is its closest current equivalent, but its
# free tier is only 20 requests/day — too tight for a CV tool where every
# "Enhance with AI" click is one request. The "-lite" tier is built for
# higher-volume, cheaper usage and is friendlier to the free tier, which was
# the actual point of this migration. Both are aliases, so neither pins to
# a specific version that can go stale the way "gemini-2.0-flash" did.
GEMINI_MODEL = "gemini-flash-lite-latest"

SUMMARY_SYSTEM_PROMPT = """
You are writing a professional summary for a CV that will be submitted for a university application and alongside a UK Visa and Immigration (UKVI) application. You will be given the candidate's full CV data as JSON. The summary must:
- Be strictly consistent with the education, work experience, and skills provided — never invent achievements, dates, or qualifications not present in the data
- Read as genuine and specific to this individual, not generic or templated
- Emphasize academic background, relevant experience, and clear intent/motivation in a way that supports a credible study/visa narrative (continuity between past experience and field of study, career stability where evident from role seniority, genuine purpose)
- Avoid exaggerated claims, superlatives, or anything that could read as inconsistent under scrutiny
- Be 3-5 sentences, formal and professional in tone
- Write in the standard CV/resume convention: implied first-person, with no pronouns and no restating the candidate's name. Do NOT write sentences like "[Name] is a..." or "He/She has...". Instead, start directly with the descriptor — for example: "Full-stack developer and business leader with hands-on experience building...". The candidate's name and identity are already shown elsewhere on the CV; the summary itself should read the way the candidate would describe their own background in a resume, not the way a biography or third-person profile would.

Write in a natural, human tone — the way a real person would describe their own background, not the way an AI assistant writes:
- Vary sentence length and structure; avoid formulaic patterns
- Avoid AI-cliche phrases entirely: "proven track record," "passionate about," "results-driven," "dynamic," "leverage," "utilize," "spearheaded," "seamless," "robust," "delve into," "furthermore," "moreover"
- Use plain, direct language over inflated vocabulary - say "managed" not "orchestrated"
- Avoid triple-adjective strings and overly symmetric sentence construction
- Keep it grounded and specific to the actual CV data - specific numbers, institutions, and responsibilities read as more human than vague generalities
- Do not use em-dashes; use commas or periods instead

Return ONLY the summary paragraph text - no quotes, no markdown, no headings, no commentary.
"""

EXPERIENCE_SYSTEM_PROMPT = """
You are a professional CV writer. Given context about one work experience entry (role, company, and any existing draft), write 3 to 5 concise, achievement-oriented bullet points describing responsibilities and accomplishments in that role.

Write in a natural, human tone, not the way an AI assistant writes:
- Vary sentence length and structure across bullets; avoid starting every bullet with the same verb tense pattern
- Avoid AI-cliche phrases entirely: "proven track record," "passionate about," "results-driven," "dynamic," "leverage," "utilize," "spearheaded," "seamless," "robust," "delve into," "furthermore," "moreover"
- Use plain, direct language - say "managed" not "orchestrated," say "built" not "engineered a comprehensive solution for"
- Keep bullets grounded and specific to the context given, avoid vague generalities
- Do not use em-dashes; use commas or periods instead
- Avoid personal pronouns

Return ONLY a valid JSON array of strings (no markdown fences, no commentary, no extra keys).
"""

SKILLS_SYSTEM_PROMPT = """
You are helping a candidate identify relevant skills for their CV, based on their education and work experience. You will be given the candidate's full CV data as JSON (education entries, work experience entries with responsibilities, and any skills already listed).

Suggest relevant skills that are genuinely supported by the candidate's education and experience — both technical/hard skills and relevant soft skills where clearly evidenced by their work history (e.g., "Team Leadership" if their experience shows managing people, "Client Communication" if their role involved client-facing work).

Rules:
- Every suggested skill must be reasonably inferable from the actual education/experience data provided — do not invent skills unrelated to their background
- Do not repeat skills already listed in the candidate's existing skills, if any are provided
- Prefer specific, concrete skills over vague ones (e.g., "Adobe Photoshop" over "Design Tools", "SQL" over "Databases") where the specificity is supported by the data
- Order roughly by relevance/prominence in their background
- If the candidate has already listed many relevant skills, suggest only the genuinely new ones actually missing — this may be as few as 1-3 skills, or even none if the existing list is already comprehensive. Do not pad the response to reach a target count. It is correct and expected to return an empty list if nothing new is genuinely supported by the CV data.
- If the candidate has no skills listed yet, suggest a fuller list (typically 8-15) covering the range of what's evidenced in their education and experience.

Write in a natural, human tone — the way a real person would list their own skills, not the way an AI assistant writes:
- Use plain, concrete skill names, not padded or overly formal phrasing (e.g. "Excel" not "Proficient in Microsoft Excel Applications")
- Avoid vague, inflated buzzwords as standalone skills (e.g. don't suggest generic entries like "Dynamic Problem Solver" or "Results-Driven Professional" — these aren't real skills, they're filler)
- Keep each skill to a short phrase (1-4 words), the way skills actually appear on a real CV, not a sentence or description

Return ONLY a valid JSON array of skill strings, no markdown fences, no commentary, no extra keys. Return an empty array `[]` if there is genuinely nothing new to add.
"""


PASSPORT_SYSTEM_PROMPT = """
You are an expert at reading passport documents. You will be given one or two images: a passport's bio-data (photo) page, and optionally a second image of a separate address/particulars page.

Step 1 — MRZ: Locate the two-line Machine-Readable Zone (MRZ) at the bottom of the bio-data page — two lines of 44 uppercase letters, digits, and "<" filler characters, in ICAO 9303 TD3 format. Transcribe both lines EXACTLY as printed, character for character, preserving every "<" filler. Do not correct, guess, or "clean up" characters — transcribe exactly what is printed, even if a character looks ambiguous. Each line is EXACTLY 44 characters — this is fixed by the format, not a guideline. Runs of "<" fillers are the easiest part to miscount: after transcribing each line, count its characters one at a time; if a line is not exactly 44 characters, find and fix the run of "<" fillers you miscounted (add or remove "<" characters there, never elsewhere) before writing your final answer. Never truncate or pad a line with the wrong data just to hit 44 — the count must come from careful re-reading, not from arbitrarily adding/removing fillers.

Step 2 — Parse: From the MRZ (or, if the MRZ is smudged, damaged, or otherwise unreadable, from the printed text elsewhere on the bio-data page as a fallback) determine: document type, issuing country, surname, given names, passport number, nationality, date of birth, sex, and date of expiry.

Step 3 — Date of Issue: The MRZ does NOT encode a date of issue — ICAO 9303 has no field for it, so it can never be read or derived from the MRZ lines. It only exists as printed text elsewhere on the bio-data page, usually near the passport number and date of expiry, labeled "Date of Issue", "Issued", or similar. Locate that printed label and read the date next to it. If no such printed date is visible or legible in the provided image(s) — for example if that part of the page is cropped out of frame or obscured — return null for it. Never guess, estimate, or derive this date from the date of birth, date of expiry, or any other field.

Step 4 — Address: Examine every image provided (the bio-data page and, if given, the second image) for a permanent address section — common on Nepali passports and some others, and frequently printed across TWO OR MORE LINES (e.g. a village/ward/municipality line followed by a separate district or province line). Read the ENTIRE address block from top to bottom, line by line, and concatenate every line into the final value in the order printed — transcribing only the last line, the most prominent line, or a single word (e.g. returning just the district name while silently dropping the village/ward/municipality that preceded it) is a critical error, not an acceptable shortening. Preserve every piece of information exactly as printed — do not reword, restructure, merge or reorder fields, or drop any part. The one exception is casing: if the printed address is in ALL CAPS (as on most Nepali passports), convert it to natural title case (e.g. "RANIRATAWADA, MAHOTTARI 4, MAHOTTARI" becomes "Raniratawada, Mahottari 4, Mahottari") — this is a casing normalization only, so keep every word, number, and comma from the original exactly where it is; do not shorten, summarize, or otherwise change the content while doing this. Do NOT include or guess a postal code — postal codes are out of scope and must never appear in your output, even if one is visible in the source text (omit it from the transcription if so). If no address section is visible on any image, the address is null — never invent or guess one.

Return ONLY this exact JSON object, no markdown fences, no commentary:
{
  "full_name": "<given names + surname, as a single display name, title case>",
  "passport_number": "<as printed>",
  "nationality": "<full country adjective/name, e.g. \\"Nepalese\\", not a 3-letter code>",
  "dob": "<DD MMM YYYY, e.g. \\"05 Jan 1998\\">",
  "sex": "<single letter: M, F, or X>",
  "issued_date": "<DD MMM YYYY, as printed on the visual page (NOT the MRZ) near the passport number/expiry date, or null if not legible in the provided image(s)>",
  "expiry_date": "<DD MMM YYYY>",
  "issuing_country": "<full country name, e.g. \\"Nepal\\", not a 3-letter code>",
  "permanent_address": "<address text exactly as printed, WITHOUT any postal code, or null if not visible on any image>",
  "mrz_read": <true if you found and transcribed a legible 2-line MRZ, false if you had to rely on the visual fallback>,
  "mrz_line1": "<the exact 44-character MRZ line 1 as transcribed, or null if mrz_read is false>",
  "mrz_line2": "<the exact 44-character MRZ line 2 as transcribed, or null if mrz_read is false>"
}

If a field genuinely cannot be determined from any provided image, use an empty string "" for it (except permanent_address, issued_date, and the mrz_line fields, which use null). Never fabricate a value.
"""


class AIGenerationError(Exception):
    pass


def _call_ai_model(system_prompt: str, contents, json_mode: bool = False) -> str:
    """`contents` is whatever google-generativeai's generate_content() accepts
    directly: a plain string for text-only prompts, or a list mixing image
    parts (`{"mime_type": ..., "data": <bytes>}`) with strings for vision
    calls like the passport scanner.
    """
    if not settings.GEMINI_API_KEY:
        raise AIGenerationError("GEMINI_API_KEY is not configured on the server.")

    genai.configure(api_key=settings.GEMINI_API_KEY)

    generation_config = (
        genai.GenerationConfig(response_mime_type="application/json") if json_mode else None
    )

    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=system_prompt,
        generation_config=generation_config,
    )

    last_exc = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = model.generate_content(contents)
            return response.text.strip()
        except google_exceptions.ResourceExhausted as exc:
            last_exc = exc
            if attempt == MAX_RETRIES:
                break
            wait_seconds = BASE_BACKOFF_SECONDS * (2**attempt) + random.uniform(0, 0.5)
            logger.warning(
                "Gemini rate limit hit (attempt %d/%d) — retrying in %.1fs: %s",
                attempt + 1,
                MAX_RETRIES + 1,
                wait_seconds,
                exc,
            )
            time.sleep(wait_seconds)
        except google_exceptions.GoogleAPIError as exc:
            raise AIGenerationError(f"Gemini API error: {exc}") from exc

    # Retries exhausted — log the real error for our own visibility, but
    # don't expose "429 ResourceExhausted" jargon to the user.
    logger.error(
        "Gemini rate limit exceeded after %d attempts: %s", MAX_RETRIES + 1, last_exc
    )
    raise AIGenerationError(RATE_LIMIT_MESSAGE) from last_exc


def _strip_code_fence(text: str) -> str:
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return text


def generate_summary(prompt: str) -> str:
    """Generate a free-text CV summary paragraph."""
    return _call_ai_model(SUMMARY_SYSTEM_PROMPT, prompt)


def generate_experience_bullets(prompt: str) -> list:
    """Generate a list of achievement-oriented bullet points for one role."""
    text = _strip_code_fence(_call_ai_model(EXPERIENCE_SYSTEM_PROMPT, prompt, json_mode=True))

    try:
        bullets = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"Model returned invalid JSON: {exc}") from exc

    if not isinstance(bullets, list) or not all(isinstance(b, str) for b in bullets):
        raise AIGenerationError("Model did not return a JSON array of strings.")

    return bullets


def generate_skills(prompt: str) -> list:
    """Generate a list of skills suggested from the candidate's CV data."""
    text = _strip_code_fence(_call_ai_model(SKILLS_SYSTEM_PROMPT, prompt, json_mode=True))

    try:
        skills = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"Model returned invalid JSON: {exc}") from exc

    if not isinstance(skills, list) or not all(isinstance(s, str) for s in skills):
        raise AIGenerationError("Model did not return a JSON array of strings.")

    return skills


def scan_passport(images: list) -> dict:
    """Read a passport's bio-data (and optional address) page(s) via Gemini
    vision. `images` is 1-2 dicts of {"mime_type": str, "data": bytes} —
    bio-data page first, optional address page second.

    Returns the extracted fields plus `mrz_read` (whether a legible MRZ was
    found) and `checksums_valid` (whether the MRZ's own ICAO check digits,
    validated independently server-side, confirm the transcription) so the
    frontend can show a confidence signal — this never blocks the result,
    the user still has to confirm the fields against their physical
    passport either way.
    """
    contents = [
        {"mime_type": img["mime_type"], "data": img["data"]} for img in images
    ] + ["Extract the passport data from the image(s) above, following the instructions exactly."]

    text = _strip_code_fence(_call_ai_model(PASSPORT_SYSTEM_PROMPT, contents, json_mode=True))

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"Model returned invalid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise AIGenerationError("Model did not return a JSON object.")

    mrz_read = bool(data.get("mrz_read"))
    mrz_line1 = data.get("mrz_line1")
    mrz_line2 = data.get("mrz_line2")

    checksums_valid = False
    if mrz_read and isinstance(mrz_line1, str) and isinstance(mrz_line2, str):
        checksums_valid = validate_td3_mrz(mrz_line1.strip(), mrz_line2.strip())["valid"]

    permanent_address = data.get("permanent_address")
    issued_date = data.get("issued_date")

    return {
        "full_name": str(data.get("full_name") or ""),
        "passport_number": str(data.get("passport_number") or ""),
        "nationality": str(data.get("nationality") or ""),
        "dob": str(data.get("dob") or ""),
        "sex": str(data.get("sex") or ""),
        "issued_date": issued_date.strip() if isinstance(issued_date, str) and issued_date.strip() else None,
        "expiry_date": str(data.get("expiry_date") or ""),
        "issuing_country": str(data.get("issuing_country") or ""),
        "permanent_address": permanent_address if isinstance(permanent_address, str) else None,
        "mrz_read": mrz_read,
        "checksums_valid": checksums_valid,
    }
