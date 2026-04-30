"""Support behavior guidelines and scoring logic."""

from __future__ import annotations

from dataclasses import dataclass


PRODUCTION_SUPPORT_GUIDELINES: list[str] = [
    "Acknowledge user impact and set a clear empathy tone.",
    "Summarize the issue in your own words before proposing fixes.",
    "Ask for missing diagnostics: scope, timeframe, and affected users.",
    "Prioritize mitigation over root cause if incident severity is high.",
    "State next update time and maintain communication cadence.",
    "Avoid guessing; label assumptions and verify evidence.",
    "Escalate to engineering with precise reproduction details when needed.",
    "Document actions, timeline, and customer-facing message after resolution.",
]


@dataclass(frozen=True)
class GuidelineCase:
    prompt: str
    required_keywords: list[str]


GUIDELINE_TEST_CASES: list[GuidelineCase] = [
    GuidelineCase(
        prompt="A premium customer reports global outage with critical workflows blocked. Respond as CSM.",
        required_keywords=["impact", "mitigation", "update", "escalate"],
    ),
    GuidelineCase(
        prompt="Customer says reports are delayed by 4 hours for APAC users only. Respond as CSM.",
        required_keywords=["scope", "timeframe", "diagnostics", "next update"],
    ),
    GuidelineCase(
        prompt="A frustrated customer asks for immediate RCA while outage is ongoing. Respond as CSM.",
        required_keywords=["priority", "stabilize", "assumption", "communication"],
    ),
]


def score_guideline_response(response: str, required_keywords: list[str]) -> float:
    lowered = response.lower()
    hits = sum(1 for keyword in required_keywords if keyword.lower() in lowered)
    return round(100.0 * hits / len(required_keywords), 2)
