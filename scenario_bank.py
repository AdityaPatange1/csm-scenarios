"""Scenario bank generation, storage, and sampling."""

from __future__ import annotations

import json
import random
from pathlib import Path

from config import AppConfig
from models import Scenario


class ScenarioBank:
    def __init__(self, config: AppConfig, seed: int = 42):
        self.config = config
        self._rand = random.Random(seed)

    def ensure_bank_exists(self, min_records: int = 10_500) -> None:
        path = self.config.bank_file
        if path.exists() and self._count_records(path) >= min_records:
            return

        records = self._generate_records(min_records)
        with path.open("w", encoding="utf-8") as handle:
            for rec in records:
                handle.write(json.dumps(rec, ensure_ascii=True) + "\n")

    def _count_records(self, path: Path) -> int:
        with path.open("r", encoding="utf-8") as handle:
            return sum(1 for _ in handle)

    def _generate_records(self, total: int) -> list[dict]:
        categories = [
            "incident_management",
            "adoption_risk",
            "integration_issue",
            "billing_dispute",
            "security_compliance",
            "renewal_risk",
            "onboarding_blocker",
        ]
        topics = [
            "Netflix down debugging",
            "API timeout spike",
            "SSO login failure",
            "dashboard latency regression",
            "invoice mismatch escalation",
            "data pipeline delay",
            "regional outage communication",
            "feature rollout confusion",
            "mobile crash increase",
        ]
        profiles = [
            "Enterprise customer with strict SLA and executive visibility",
            "Mid-market customer with lean engineering team",
            "Digital-native customer sensitive to real-time uptime",
            "Regulated industry customer with compliance deadlines",
        ]
        constraints_pool = [
            "Engineering team available in 30 minutes",
            "No direct DB access allowed",
            "Customer needs update every 20 minutes",
            "Incident channel already includes VP support",
            "Cannot deploy hotfix before change window",
        ]
        outcomes = [
            "Issue stabilized and customer confirms acceptable workaround",
            "Root cause isolated with postmortem timeline committed",
            "Customer sentiment recovered with transparent communication",
            "Escalation closed with executive summary delivered",
        ]
        difficulties = ["easy", "medium", "hard"]

        records: list[dict] = []
        for index in range(total):
            topic = topics[index % len(topics)]
            category = categories[index % len(categories)]
            scenario = {
                "scenario_id": f"scn_{index + 1:05d}",
                "category": category,
                "difficulty": difficulties[index % len(difficulties)],
                "topic": topic,
                "customer_profile": profiles[index % len(profiles)],
                "issue_summary": f"{topic} affecting critical workflows for customer segment {index % 250}.",
                "expected_outcome": outcomes[index % len(outcomes)],
                "constraints": self._rand.sample(constraints_pool, k=2),
                "tags": [category, topic.lower().replace(" ", "_"), difficulties[index % 3]],
            }
            records.append(scenario)
        return records

    def sample(self, topic_hint: str | None = None) -> Scenario:
        pool: list[dict] = []
        topic_hint = (topic_hint or "").strip().lower()
        with self.config.bank_file.open("r", encoding="utf-8") as handle:
            for line in handle:
                rec = json.loads(line)
                if topic_hint and topic_hint in rec["topic"].lower():
                    pool.append(rec)
                elif not topic_hint and self._rand.randint(0, 24) == 0:
                    pool.append(rec)

        if not pool:
            with self.config.bank_file.open("r", encoding="utf-8") as handle:
                pool = [json.loads(line) for line in handle]

        chosen = self._rand.choice(pool)
        return Scenario(**chosen)
