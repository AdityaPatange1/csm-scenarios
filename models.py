"""Shared datamodels for app flows and logging."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Message:
    role: str
    content: str
    created_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Scenario:
    scenario_id: str
    category: str
    difficulty: str
    topic: str
    customer_profile: str
    issue_summary: str
    expected_outcome: str
    constraints: list[str]
    tags: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SessionLog:
    mode: str
    title: str
    scenario: Scenario | None
    messages: list[Message]
    score: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    session_id: str = field(default_factory=lambda: uuid4().hex)
    created_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["scenario"] = self.scenario.to_dict() if self.scenario else None
        payload["messages"] = [m.to_dict() for m in self.messages]
        return payload
