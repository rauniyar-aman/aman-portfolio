import json

import anthropic
from django.conf import settings

CV_SCHEMA_INSTRUCTIONS = """
You are a professional CV/resume writer. Given the user's prompt describing \
their background, generate CV content and return ONLY valid JSON (no markdown \
fences, no commentary) matching exactly this shape:

{
  "personal_info": {
    "name": string,
    "email": string,
    "phone": string,
    "location": string,
    "summary": string
  },
  "experience": [
    {
      "title": string,
      "company": string,
      "start_date": string,
      "end_date": string,
      "description": string
    }
  ],
  "education": [
    {
      "degree": string,
      "institution": string,
      "year": string
    }
  ],
  "skills": [string]
}

Leave fields as empty strings/arrays if the user did not provide that \
information. Do not invent facts that weren't implied by the prompt.
"""


class AIGenerationError(Exception):
    pass


def generate_cv_content(prompt: str) -> dict:
    """Call the Anthropic API server-side to generate structured CV content."""
    if not settings.ANTHROPIC_API_KEY:
        raise AIGenerationError("ANTHROPIC_API_KEY is not configured on the server.")

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            system=CV_SCHEMA_INSTRUCTIONS,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as exc:
        raise AIGenerationError(f"Anthropic API error: {exc}") from exc

    text = "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()

    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"Model returned invalid JSON: {exc}") from exc
