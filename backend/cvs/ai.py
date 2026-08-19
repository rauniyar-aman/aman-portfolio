import json
import logging
import random
import time

import google.generativeai as genai
from django.conf import settings
from google.api_core import exceptions as google_exceptions

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


class AIGenerationError(Exception):
    pass


def _call_ai_model(system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
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
            response = model.generate_content(user_prompt)
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
