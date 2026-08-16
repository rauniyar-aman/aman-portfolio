import json

import anthropic
from django.conf import settings

SUMMARY_SYSTEM_PROMPT = """
You are a professional CV writer. Given context about a candidate, write a \
single professional CV summary paragraph (2-4 sentences). Return ONLY the \
paragraph text — no quotes, no markdown, no headings, no commentary.
"""

EXPERIENCE_SYSTEM_PROMPT = """
You are a professional CV writer. Given context about one work experience \
entry (role, company, and any existing draft), write 3 to 5 concise, \
achievement-oriented bullet points describing responsibilities and \
accomplishments in that role. Each bullet should start with a strong action \
verb, avoid personal pronouns, and be specific where the context supports it. \
Return ONLY a valid JSON array of strings (no markdown fences, no commentary, \
no extra keys) — for example: ["Led a team of 4 engineers...", "Reduced page \
load time by 40%...", "Built and shipped..."].
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
