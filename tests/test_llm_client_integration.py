import os
from pathlib import Path

import pytest

from config import AppConfig
from llm_client import LLMClient


def _config() -> AppConfig:
    return AppConfig(
        root_dir=Path("."),
        data_dir=Path("./data"),
        sessions_dir=Path("./data/sessions"),
        validation_sessions_dir=Path("./validation_data/sessions"),
        bank_file=Path("./data/scenario_bank.jsonl"),
        openai_base_url="https://api.openai.com/v1",
        openai_api_key="test-key",
        openai_model="gpt-4o-mini",
        request_timeout_s=5,
        debug_llm=False,
    )


def test_llm_client_openai_success(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, str, str]] = []

    class FakeCompletions:
        def create(self, model: str, messages):
            calls.append(("https://api.openai.com/v1", "test-key", model))
            _ = messages
            msg = type("M", (), {"content": "openai ok"})()
            choice = type("C", (), {"message": msg})()
            return type("R", (), {"choices": [choice]})()

    class FakeOpenAI:
        def __init__(self, api_key: str, base_url: str, timeout=None):
            _ = timeout
            self.api_key = api_key
            self.base_url = base_url
            self.chat = type("Chat", (), {"completions": FakeCompletions()})()

    monkeypatch.setattr("llm_client.OpenAI", FakeOpenAI)
    client = LLMClient(_config())
    output = client.generate("sys", "usr")
    diag = client.diagnostics()

    assert output == "openai ok"
    assert diag["provider_used"] == "openai"
    assert calls == [("https://api.openai.com/v1", "test-key", "gpt-4o-mini")]


def test_llm_client_uses_static_fallback_when_provider_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeCompletions:
        def create(self, model: str, messages):
            _ = model, messages
            raise RuntimeError("provider fail")

    class FakeOpenAI:
        def __init__(self, api_key: str, base_url: str, timeout=None):
            _ = api_key, base_url, timeout
            self.chat = type("Chat", (), {"completions": FakeCompletions()})()

    monkeypatch.setattr("llm_client.OpenAI", FakeOpenAI)
    client = LLMClient(_config())
    output = client.generate("sys", "usr")
    diag = client.diagnostics()

    assert "fallback mode" in output.lower()
    assert diag["used_fallback"] is True
    assert diag["provider_used"] == ""
    assert len(diag["attempts"]) == 1


@pytest.mark.skipif(
    os.getenv("RUN_OPENAI_INTEGRATION") != "1",
    reason="Set RUN_OPENAI_INTEGRATION=1 to run live OpenAI integration test.",
)
def test_llm_client_live_healthcheck() -> None:
    from config import load_config

    client = LLMClient(load_config())
    healthy, _ = client.health_check()
    assert isinstance(healthy, bool)
