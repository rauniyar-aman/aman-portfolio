import json

import google.generativeai as genai
from django.conf import settings
from google.api_core import exceptions as google_exceptions

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

    try:
        response = model.generate_content(user_prompt)
    except google_exceptions.GoogleAPIError as exc:
        raise AIGenerationError(f"Gemini API error: {exc}") from exc

    return response.text.strip()


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
