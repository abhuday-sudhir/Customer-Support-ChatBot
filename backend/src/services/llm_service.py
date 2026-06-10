"""
LLM Service – provider-agnostic wrapper around Anthropic / OpenAI / Gemini.

Design:
  - generateReply(history, user_message) is the single public function.
  - The concrete provider is selected at startup from LLM_PROVIDER env var.
  - All provider-specific error types are caught and re-raised as LLMError,
    so the rest of the app never needs to import anthropic / openai directly.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

from src.config import get_settings
from src.utils.faq import build_system_prompt

logger = logging.getLogger(__name__)
settings = get_settings()


# ─── Domain types ─────────────────────────────────────────────────────────────

@dataclass
class HistoryMessage:
    role: Literal["user", "assistant"]
    content: str


class LLMError(Exception):
    """Raised for any LLM-provider error (timeout, auth, rate-limit, etc.)"""


# ─── Anthropic provider ───────────────────────────────────────────────────────

def _call_anthropic(system: str, history: list[HistoryMessage]) -> str:
    try:
        import anthropic
    except ImportError as e:
        raise LLMError("anthropic package not installed") from e

    if not settings.anthropic_api_key:
        raise LLMError("ANTHROPIC_API_KEY is not set.")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    messages = [{"role": m.role, "content": m.content} for m in history]

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=settings.llm_max_tokens,
            system=system,
            messages=messages,
        )
        return response.content[0].text
    except anthropic.AuthenticationError as e:
        raise LLMError("Invalid Anthropic API key. Check ANTHROPIC_API_KEY.") from e
    except anthropic.RateLimitError as e:
        raise LLMError("Anthropic rate limit reached. Please try again shortly.") from e
    except anthropic.APITimeoutError as e:
        raise LLMError("Request to Anthropic timed out. Please try again.") from e
    except anthropic.APIConnectionError as e:
        raise LLMError("Could not connect to Anthropic API.") from e
    except anthropic.APIStatusError as e:
        raise LLMError(f"Anthropic API error: {e.message}") from e


# ─── OpenAI provider ──────────────────────────────────────────────────────────

def _call_openai(system: str, history: list[HistoryMessage]) -> str:
    try:
        import openai as oai
    except ImportError as e:
        raise LLMError("openai package not installed") from e

    if not settings.openai_api_key:
        raise LLMError("OPENAI_API_KEY is not set.")

    client = oai.OpenAI(api_key=settings.openai_api_key)

    messages: list[dict] = [{"role": "system", "content": system}]
    messages += [{"role": m.role, "content": m.content} for m in history]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=settings.llm_max_tokens,
            messages=messages,
        )
        return response.choices[0].message.content or ""
    except oai.AuthenticationError as e:
        raise LLMError("Invalid OpenAI API key. Check OPENAI_API_KEY.") from e
    except oai.RateLimitError as e:
        raise LLMError("OpenAI rate limit reached. Please try again shortly.") from e
    except oai.APITimeoutError as e:
        raise LLMError("Request to OpenAI timed out. Please try again.") from e
    except oai.APIConnectionError as e:
        raise LLMError("Could not connect to OpenAI API.") from e
    except oai.APIStatusError as e:
        raise LLMError(f"OpenAI API error: {e.message}") from e


# ─── Gemini provider ────────────────────────────────────────────────────────

def _call_gemini(system: str, history: list[HistoryMessage]) -> str:
    try:
        import google.generativeai as genai
        from google.api_core import exceptions as google_exceptions
    except ImportError as e:
        raise LLMError("google-generativeai package not installed") from e

    if not settings.gemini_api_key:
        raise LLMError("GEMINI_API_KEY is not set.")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system,
    )

    contents = [
        {
            "role": "user" if m.role == "user" else "model",
            "parts": [m.content],
        }
        for m in history
    ]

    try:
        response = model.generate_content(
            contents,
            generation_config=genai.GenerationConfig(
                max_output_tokens=settings.llm_max_tokens,
            ),
        )
        return response.text or ""
    except google_exceptions.PermissionDenied as e:
        raise LLMError("Invalid Gemini API key. Check GEMINI_API_KEY.") from e
    except google_exceptions.ResourceExhausted as e:
        raise LLMError("Gemini rate limit reached. Please try again shortly.") from e
    except google_exceptions.DeadlineExceeded as e:
        raise LLMError("Request to Gemini timed out. Please try again.") from e
    except google_exceptions.ServiceUnavailable as e:
        raise LLMError("Could not connect to Gemini API.") from e
    except google_exceptions.GoogleAPIError as e:
        raise LLMError(f"Gemini API error: {e}") from e


# ─── Public interface ─────────────────────────────────────────────────────────

def generate_reply(
    history: list[HistoryMessage],
    faq_list: list[dict] | None = None,
) -> str:
    """
    Generate an AI reply given the full conversation history.

    :param history:   Full list of prior + current messages (user message last).
    :param faq_list:  Optional FAQ rows from DB; falls back to hard-coded FAQ.
    :returns:         The AI's reply text.
    :raises LLMError: On any provider error.
    """
    # Cost-control: cap context window
    window = settings.llm_context_window
    trimmed = history[-window:] if len(history) > window else history

    system = build_system_prompt(faq_list)

    logger.info(
        "LLM call | provider=%s | context_messages=%d",
        settings.llm_provider,
        len(trimmed),
    )

    if settings.llm_provider == "anthropic":
        return _call_anthropic(system, trimmed)
    elif settings.llm_provider == "openai":
        return _call_openai(system, trimmed)
    elif settings.llm_provider == "gemini":
        return _call_gemini(system, trimmed)
    else:
        raise LLMError(f"Unknown LLM provider: {settings.llm_provider}")
