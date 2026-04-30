# Architecture - CSM Scenarios

## Goal

Provide a production-grade, terminal-native simulator for customer success incident handling and communication quality, with exportable logs for QA and coaching.

## Design Principles

- Flat module structure for simplicity and direct execution.
- Reusable domain logic despite no packaging overhead.
- Deterministic behavior where useful (seeding, fallback responses).
- Strong auditability through session exports and scenario records.

## Runtime Flow

1. `csm_scenes.py` parses CLI arguments and validates mode requirements.
2. `config.py` loads `.env`, constructs data paths, and creates required directories.
3. `scenario_bank.py` ensures `data/scenario_bank.jsonl` has >= 10,500 scenarios.
4. `engine.py` executes selected mode:
   - Interview assessment
   - Topic simulation
   - Guideline testing
   - Live conversation REPL
5. `llm_client.py` invokes OpenAI for generated customer/interviewer output.
6. `engine.py` persists structured run outputs to `data/sessions/`.

## Module Responsibilities

- `csm_scenes.py`: process orchestration and mode dispatch
- `config.py`: config hydration and path management
- `models.py`: dataclasses for scenario/message/session entities
- `scenario_bank.py`: large synthetic scenario set management
- `guidelines.py`: CSM behavioral standards and scoring
- `llm_client.py`: LLM transport and fallback path
- `ui.py`: Rich presentation layer
- `engine.py`: business logic and data persistence

## Scenario Bank Strategy

- Bank is generated as JSONL for append/read friendliness.
- Record count threshold (10,500) guarantees >10k scenarios.
- Dataset spans topic/category/difficulty/profile/constraints combinations.
- Sampling supports:
  - Topic-driven selection
  - Weighted random selection for general REPL mode

## Session Logging Contract

Each run emits:

- JSON file with full structure for analytics.
- Markdown transcript for human coaching and audit.

Both include:

- Session metadata
- Scenario metadata (if mode is scenario-backed)
- Ordered role-based transcript
- Score fields (where applicable)

## Resilience and Failure Handling

- Missing/invalid network responses do not crash simulation loops.
- LLM client uses deterministic fallback messaging when unavailable.
- Startup failures (config parse, argument mismatch) return non-zero code and clear terminal feedback.

## Extensibility

Future extension points:

- Add scenario importers from CSV/CRM exports.
- Add rubric-based scoring with weighted competencies.
- Add mode plugins by extending engine dispatch.
- Add CI validation for scenario schema integrity.
