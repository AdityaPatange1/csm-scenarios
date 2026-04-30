"""OpenAI client wrapper with resilient fallback."""

from __future__ import annotations

from typing import Any

from openai import OpenAI

from config import AppConfig


class LLMClient:
    def __init__(self, config: AppConfig):
        self.config = config
        self.last_debug: dict[str, Any] = {}

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        self.last_debug = {
            "endpoint": self.config.openai_base_url,
            "model": self.config.openai_model,
            "timeout_s": self.config.request_timeout_s,
            "api_key_loaded": bool(self.config.openai_api_key.strip()),
            "error": "",
            "status_code": None,
            "response_preview": "",
            "used_fallback": False,
            "provider_used": "openai",
            "attempts": [],
        }
        attempt: dict[str, Any] = {
            "provider": "openai",
            "endpoint": self.config.openai_base_url,
            "model": self.config.openai_model,
            "status_code": None,
            "error": "",
        }
        self.last_debug["attempts"].append(attempt)
        try:
            client = OpenAI(
                api_key=self.config.openai_api_key,
                base_url=self.config.openai_base_url,
                timeout=self.config.request_timeout_s,
            )
            response = client.chat.completions.create(
                model=self.config.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            self.last_debug["response_preview"] = str(response)[:300]
            choice = response.choices[0] if response.choices else None
            content = ""
            if choice and choice.message and choice.message.content:
                content = str(choice.message.content).strip()
            if content:
                return content
            attempt["error"] = "response_missing_expected_content"
            self.last_debug["error"] = attempt["error"]
        except Exception as exc:  # pylint: disable=broad-except
            attempt["error"] = f"unexpected_error: {exc}"
            self.last_debug["error"] = attempt["error"]

        self.last_debug["used_fallback"] = True
        self.last_debug["provider_used"] = ""
        return (
            "I am running in fallback mode (OpenAI unavailable). "
            "Recommended CSM action: acknowledge impact, collect scope and diagnostics, "
            "provide mitigation, define update cadence, and escalate with evidence."
        )

    def health_check(self) -> tuple[bool, str]:
        response = self.generate(
            "You are a health check endpoint. Reply with exactly one word: pong.",
            "ping",
        )
        is_healthy = ("pong" in response.lower()) and (
            "fallback mode" not in response.lower()
        )
        return is_healthy, response

    def diagnostics(self) -> dict[str, Any]:
        return dict(self.last_debug)
