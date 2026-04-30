"""Configuration helpers for the CSM Scenarios app."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class AppConfig:
    root_dir: Path
    data_dir: Path
    sessions_dir: Path
    validation_sessions_dir: Path
    bank_file: Path
    openai_base_url: str
    openai_api_key: str
    openai_model: str
    request_timeout_s: int
    debug_llm: bool


def load_config(model_override: str | None = None) -> AppConfig:
    root_dir = Path(__file__).resolve().parent
    env_file = root_dir / ".env"
    load_dotenv(dotenv_path=env_file if env_file.exists() else None)

    data_dir = root_dir / "data"
    sessions_dir = Path(os.getenv("CSM_SESSIONS_DIR", str(data_dir / "sessions")))
    validation_sessions_dir = root_dir / "validation_data" / "sessions"
    bank_file = data_dir / "scenario_bank.jsonl"

    model = model_override or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    api_key = os.getenv("OPENAI_API_KEY", "")
    timeout_s = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "45"))
    debug_llm = os.getenv("CSM_DEBUG_LLM", "0").strip().lower() in {"1", "true", "yes", "on"}

    data_dir.mkdir(parents=True, exist_ok=True)
    sessions_dir.mkdir(parents=True, exist_ok=True)
    validation_sessions_dir.mkdir(parents=True, exist_ok=True)

    return AppConfig(
        root_dir=root_dir,
        data_dir=data_dir,
        sessions_dir=sessions_dir,
        validation_sessions_dir=validation_sessions_dir,
        bank_file=bank_file,
        openai_base_url=base_url.rstrip("/"),
        openai_api_key=api_key,
        openai_model=model,
        request_timeout_s=max(5, timeout_s),
        debug_llm=debug_llm,
    )
