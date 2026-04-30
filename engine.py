"""Execution engine for all CLI modes."""

from __future__ import annotations

import json
from pathlib import Path

from config import AppConfig
from guidelines import PRODUCTION_SUPPORT_GUIDELINES
from llm_client import LLMClient
from models import Message, Scenario, SessionLog
from scenario_bank import ScenarioBank
from ui import ask_user, print_info, print_markdown, print_success, print_warning, render_scorecard


def _persist_session(config: AppConfig, session: SessionLog) -> tuple[Path, Path]:
    json_path = config.sessions_dir / f"{session.session_id}.json"
    md_path = config.sessions_dir / f"{session.session_id}.md"

    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(session.to_dict(), handle, ensure_ascii=True, indent=2)

    lines = [f"# {session.title}", "", f"- Mode: {session.mode}", f"- Session ID: {session.session_id}", ""]
    if session.scenario:
        lines.extend(
            [
                "## Scenario",
                f"- ID: {session.scenario.scenario_id}",
                f"- Topic: {session.scenario.topic}",
                f"- Difficulty: {session.scenario.difficulty}",
                f"- Issue: {session.scenario.issue_summary}",
                "",
            ]
        )

    lines.extend(["## Conversation Transcript", ""])
    for message in session.messages:
        lines.append(f"### {message.role.upper()}")
        lines.append(message.content)
        lines.append("")

    llm_evaluation = next(
        (m.content for m in reversed(session.messages) if m.role in {"evaluator", "assistant"}),
        "",
    )
    if llm_evaluation:
        lines.extend(["## LLM Evaluation", llm_evaluation, ""])

    if session.score is not None:
        lines.extend(["## Score", str(session.score), ""])

    with md_path.open("w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))

    return json_path, md_path


def _llm_for(config: AppConfig) -> LLMClient:
    return LLMClient(config=config)


def _run_llm_preflight(llm: LLMClient) -> tuple[bool, str]:
    healthy, raw = llm.health_check()
    diag = llm.diagnostics()
    if healthy:
        print_success("LLM preflight passed (ping/pong confirmed from OpenAI).")
    else:
        print_warning("LLM preflight degraded (using fallback responses).")
    print_info(
        "LLM preflight diagnostics: "
        f"endpoint={diag.get('endpoint')} "
        f"model={diag.get('model')} "
        f"provider_used={diag.get('provider_used') or 'none'} "
        f"api_key_loaded={diag.get('api_key_loaded')} "
        f"status_code={diag.get('status_code')} "
        f"used_fallback={diag.get('used_fallback')}"
    )
    if diag.get("error"):
        print_warning(f"LLM error detail: {diag.get('error')}")
    attempts = diag.get("attempts") or []
    if attempts and llm.config.debug_llm:
        formatted = ", ".join(
            f"{a.get('provider')}[{a.get('status_code')}]"
            + (f":{a.get('error')}" if a.get("error") else "")
            for a in attempts
        )
        print_info(f"LLM attempt trace: {formatted}")
    if llm.config.debug_llm and diag.get("response_preview"):
        print_markdown(f"**LLM response preview:** `{diag.get('response_preview')}`")
    return healthy, raw


def _parse_numbered_lines(text: str) -> list[str]:
    items: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line[:2].isdigit() and line[2:3] in {".", ")"}:
            items.append(line[3:].strip())
            continue
        if line[:1].isdigit() and line[1:2] in {".", ")"}:
            items.append(line[2:].strip())
            continue
        if line.startswith("- "):
            items.append(line[2:].strip())
    return [item for item in items if item]


def _generate_mode_brief(
    llm: LLMClient, mode: str, scenario: Scenario, requested_topic: str = ""
) -> str:
    system_prompt = (
        "You are a senior CSM trainer. Build realistic prompts from scenario context. "
        "Return concise markdown only."
    )
    user_prompt = (
        f"Mode: {mode}\n"
        f"Requested topic: {requested_topic or 'n/a'}\n"
        f"Scenario topic: {scenario.topic}\n"
        f"Customer profile: {scenario.customer_profile}\n"
        f"Issue summary: {scenario.issue_summary}\n"
        f"Constraints: {', '.join(scenario.constraints)}\n"
        "Provide a short scenario brief and scoring criteria for this mode."
    )
    return llm.generate(system_prompt, user_prompt)


def _generate_questions(llm: LLMClient, scenario: Scenario, mode: str, count: int) -> list[str]:
    system_prompt = (
        "You create customer success assessments. Return only a numbered list with no intro text."
    )
    user_prompt = (
        f"Create {count} questions for mode '{mode}' from this scenario.\n"
        f"Topic: {scenario.topic}\n"
        f"Issue: {scenario.issue_summary}\n"
        f"Customer: {scenario.customer_profile}\n"
        f"Constraints: {', '.join(scenario.constraints)}"
    )
    questions = _parse_numbered_lines(llm.generate(system_prompt, user_prompt))
    if questions:
        return questions[:count]
    return [
        f"Given {scenario.topic}, what is your highest-priority customer action?",
        "How do you set communication cadence and escalation criteria?",
        "How do you define mitigation success for the impacted customer?",
    ][:count]


def _evaluate_transcript(llm: LLMClient, mode: str, scenario: Scenario | None, messages: list[Message]) -> str:
    transcript = "\n".join(f"{m.role}: {m.content}" for m in messages)
    scenario_block = (
        f"Scenario topic: {scenario.topic}\n"
        f"Issue summary: {scenario.issue_summary}\n"
        f"Expected outcome: {scenario.expected_outcome}\n"
        if scenario
        else "Scenario topic: n/a\nIssue summary: n/a\nExpected outcome: n/a\n"
    )
    system_prompt = (
        "You are a strict CSM evaluator. Return markdown with sections: "
        "Overall Score (/100), Strengths, Risks, Missed Opportunities, Next Actions."
    )
    user_prompt = f"Mode: {mode}\n{scenario_block}\nTranscript:\n{transcript}"
    return llm.generate(system_prompt, user_prompt)


def run_interview_mode(config: AppConfig, bank: ScenarioBank) -> int:
    scenario = bank.sample(topic_hint="incident")
    llm = _llm_for(config)
    healthy, raw_ping = _run_llm_preflight(llm)

    intro = (
        "## Interview Mode\n"
        "You are being assessed on customer success fundamentals.\n"
        "Questions and evaluation are generated by OpenAI using scenario context."
    )
    print_markdown(intro)
    print_markdown(_generate_mode_brief(llm, mode="interview", scenario=scenario))
    questions = _generate_questions(llm, scenario=scenario, mode="interview", count=3)
    messages: list[Message] = []
    for idx, question in enumerate(questions, start=1):
        print_info(f"Question {idx}: {question}")
        user_answer = ask_user("Your answer")
        messages.append(Message(role="interviewer", content=question))
        messages.append(Message(role="user", content=user_answer))

    feedback = _evaluate_transcript(llm, mode="interview", scenario=scenario, messages=messages)
    print_markdown(feedback)
    messages.append(Message(role="assistant", content=feedback))

    session = SessionLog(
        mode="interview",
        title="CSM Interview Session",
        scenario=scenario,
        messages=messages,
        metadata={"llm_health_ok": healthy, "llm_ping_response": raw_ping},
    )
    json_path, md_path = _persist_session(config, session)
    print_success(f"Session exported to {json_path} and {md_path}")
    return 0


def run_simulation_mode(config: AppConfig, bank: ScenarioBank, topic: str, max_turns: int) -> int:
    scenario = bank.sample(topic_hint=topic)
    llm = _llm_for(config)
    healthy, raw_ping = _run_llm_preflight(llm)

    print_markdown("## Simulation Mode")
    print_markdown(_generate_mode_brief(llm, mode="simulate", scenario=scenario, requested_topic=topic))

    messages: list[Message] = []
    for turn in range(max_turns):
        user_prompt = ask_user(f"Turn {turn + 1} - CSM response (type 'resolve' to end)")
        messages.append(Message(role="user", content=user_prompt))
        if user_prompt.strip().lower() == "resolve":
            break

        system_prompt = (
            "Act as a realistic customer in a production customer support simulation. "
            "Push for clarity, ask for updates, and mirror incident pressure."
        )
        assistant_reply = llm.generate(system_prompt, user_prompt)
        print_markdown(f"**Customer:** {assistant_reply}")
        messages.append(Message(role="assistant", content=assistant_reply))

    evaluation = _evaluate_transcript(llm, mode="simulate", scenario=scenario, messages=messages)
    print_markdown(evaluation)
    messages.append(Message(role="evaluator", content=evaluation))

    session = SessionLog(
        mode="simulate",
        title=f"Simulation - {scenario.topic}",
        scenario=scenario,
        messages=messages,
        metadata={
            "requested_topic": topic,
            "max_turns": max_turns,
            "llm_health_ok": healthy,
            "llm_ping_response": raw_ping,
        },
    )
    json_path, md_path = _persist_session(config, session)
    print_success(f"Simulation exported to {json_path} and {md_path}")
    return 0


def run_guideline_test_mode(config: AppConfig, bank: ScenarioBank) -> int:
    scenario = bank.sample(topic_hint="incident")
    llm = _llm_for(config)
    healthy, raw_ping = _run_llm_preflight(llm)
    print_markdown(
        "## Guideline Test Mode\n"
        "You will be tested against production support guidelines using LLM-generated cases."
    )
    print_markdown(_generate_mode_brief(llm, mode="test-guidelines", scenario=scenario))

    messages: list[Message] = []
    questions = _generate_questions(llm, scenario=scenario, mode="test-guidelines", count=3)
    for case_prompt in questions:
        print_warning(case_prompt)
        response = ask_user("Your response")
        messages.append(Message(role="examiner", content=case_prompt))
        messages.append(Message(role="user", content=response))

    evaluation = _evaluate_transcript(llm, mode="test-guidelines", scenario=scenario, messages=messages)
    print_markdown(evaluation)
    messages.append(Message(role="evaluator", content=evaluation))
    render_scorecard([("Cases", str(len(questions))), ("Guidelines loaded", str(len(PRODUCTION_SUPPORT_GUIDELINES)))])

    session = SessionLog(
        mode="test-guidelines",
        title="Guidelines Assessment",
        scenario=scenario,
        messages=messages,
        metadata={"llm_health_ok": healthy, "llm_ping_response": raw_ping},
    )
    json_path, md_path = _persist_session(config, session)
    print_success(f"Guideline assessment exported to {json_path} and {md_path}")
    return 0


def run_conversation_mode(config: AppConfig, bank: ScenarioBank, max_turns: int) -> int:
    scenario: Scenario = bank.sample()
    llm = _llm_for(config)
    healthy, raw_ping = _run_llm_preflight(llm)

    print_markdown(
        "## Conversation Mode\n"
        f"Live CSM REPL started for **{scenario.topic}**.\n"
        "Type `resolve` once the incident is handled."
    )
    print_markdown(_generate_mode_brief(llm, mode="conversation", scenario=scenario))

    messages: list[Message] = []
    for turn in range(max_turns):
        csm_text = ask_user("CSM")
        messages.append(Message(role="user", content=csm_text))
        if csm_text.strip().lower() == "resolve":
            break

        prompt = (
            "You are a customer stakeholder during an active incident. "
            "Respond with realistic pressure and ask for confidence-building updates."
        )
        customer_text = llm.generate(prompt, csm_text)
        print_markdown(f"**Customer:** {customer_text}")
        messages.append(Message(role="assistant", content=customer_text))

    evaluation = _evaluate_transcript(llm, mode="conversation", scenario=scenario, messages=messages)
    print_markdown(evaluation)
    messages.append(Message(role="evaluator", content=evaluation))

    session = SessionLog(
        mode="conversation",
        title=f"Conversation - {scenario.topic}",
        scenario=scenario,
        messages=messages,
        metadata={"max_turns": max_turns, "llm_health_ok": healthy, "llm_ping_response": raw_ping},
    )
    json_path, md_path = _persist_session(config, session)
    print_success(f"Conversation exported to {json_path} and {md_path}")
    return 0
