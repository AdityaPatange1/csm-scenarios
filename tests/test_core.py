from pathlib import Path

from config import AppConfig
from guidelines import score_guideline_response
from models import Message, Scenario, SessionLog
from scenario_bank import ScenarioBank


def test_guideline_score_is_percentage() -> None:
    score = score_guideline_response(
        "I acknowledge impact, begin mitigation, and provide next update cadence.",
        ["impact", "mitigation", "update", "escalate"],
    )
    assert score == 75.0


def test_scenario_bank_generates_minimum_records(tmp_path: Path) -> None:
    data_dir = tmp_path / "data"
    sessions_dir = data_dir / "sessions"
    data_dir.mkdir(parents=True, exist_ok=True)
    sessions_dir.mkdir(parents=True, exist_ok=True)
    bank_file = data_dir / "scenario_bank.jsonl"

    config = AppConfig(
        root_dir=tmp_path,
        data_dir=data_dir,
        sessions_dir=sessions_dir,
        validation_sessions_dir=sessions_dir,
        bank_file=bank_file,
        openai_base_url="https://api.openai.com/v1",
        openai_api_key="",
        openai_model="gpt-4o-mini",
        request_timeout_s=20,
        debug_llm=False,
    )

    bank = ScenarioBank(config=config, seed=123)
    bank.ensure_bank_exists(min_records=120)

    with bank_file.open("r", encoding="utf-8") as handle:
        assert sum(1 for _ in handle) >= 120


def test_session_serialization_contains_messages() -> None:
    scenario = Scenario(
        scenario_id="scn_00001",
        category="incident_management",
        difficulty="medium",
        topic="Netflix down debugging",
        customer_profile="Enterprise customer",
        issue_summary="Outage impacting core workflows.",
        expected_outcome="Customer stabilized with mitigation.",
        constraints=["Engineering team available in 30 minutes"],
        tags=["incident", "outage"],
    )
    session = SessionLog(
        mode="simulate",
        title="Simulation Test",
        scenario=scenario,
        messages=[Message(role="user", content="Investigating now.")],
    )
    payload = session.to_dict()
    assert payload["mode"] == "simulate"
    assert payload["scenario"]["topic"] == "Netflix down debugging"
    assert payload["messages"][0]["role"] == "user"
