import json

import anthropic
from django.conf import settings

SUMMARY_SYSTEM_PROMPT = """
You are writing a professional summary for a CV that will be submitted for a university application and alongside a UK Visa and Immigration (UKVI) application. You will be given the candidate's full CV data as JSON. The summary must:
- Be strictly consistent with the education, work experience, and skills provided — never invent achievements, dates, or qualifications not present in the data
- Read as genuine and specific to this individual, not generic or templated
- Emphasize academic background, relevant experience, and clear intent/motivation in a way that supports a credible study/visa narrative (continuity between past experience and field of study, career stability where evident from role seniority, genuine purpose)
- Avoid exaggerated claims, superlatives, or anything that could read as inconsistent under scrutiny
- Be 3-5 sentences, formal and professional in tone

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


def _call_claude(system_prompt: str, user_prompt: str) -> str:
    if not settings.ANTHROPIC_API_KEY:
        raise AIGenerationError("ANTHROPIC_API_KEY is not configured on the server.")

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.APIError as exc:
        raise AIGenerationError(f"Anthropic API error: {exc}") from exc

    return "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()


def _strip_code_fence(text: str) -> str:
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return text


def generate_summary(prompt: str) -> str:
    """Generate a free-text CV summary paragraph."""
    return _call_claude(SUMMARY_SYSTEM_PROMPT, prompt)


def generate_experience_bullets(prompt: str) -> list:
    """Generate a list of achievement-oriented bullet points for one role."""
    text = _strip_code_fence(_call_claude(EXPERIENCE_SYSTEM_PROMPT, prompt))

    try:
        bullets = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"Model returned invalid JSON: {exc}") from exc

    if not isinstance(bullets, list) or not all(isinstance(b, str) for b in bullets):
        raise AIGenerationError("Model did not return a JSON array of strings.")

    return bullets
