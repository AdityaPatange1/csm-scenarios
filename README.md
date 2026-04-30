# CSM Scenarios

`CSM Scenarios` is a production-oriented terminal simulation app for Customer Success teams. It runs realistic incident and support scenarios, evaluates responses, and exports full transcripts and metadata into `data/` for post-run review and coaching.

The project uses a flat Python module structure (no packaged pip module) while keeping logic reusable through internal imports.

## Features

- 10,500+ scenario bank generation in `data/scenario_bank.jsonl`
- Multiple simulation modes for training and skill assessment
- OpenAI integration for realistic customer behavior and evaluations
- Rich terminal output with markdown rendering and styled status messages
- Environment variable support via `.env`
- Session export of complete transcripts to structured JSON + Markdown

## Quick Start

1. Install Python 3.11+.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment:

```bash
cp .env.example .env
```

4. Fill `OPENAI_API_KEY` and adjust model/base URL if required.

### Makefile workflow

```bash
make install-dev
make validate
```

Useful commands:

- `make run-interview`
- `make run-simulate TOPIC="Netflix down debugging"`
- `make run-test-guidelines`
- `make run-conversation`
- `make smoke`
- `make test-openai-live` (runs only live OpenAI integration test)

## CLI Usage

### Interview mode

```bash
python csm_scenes.py --interview
```

Conducts a focused CSM interview with AI-based evaluation.

### Incident simulation mode

```bash
python csm_scenes.py --simulate --topic "Netflix down debugging"
```

Runs a full scenario simulation around the provided topic.

### Guideline test mode

```bash
python csm_scenes.py --test-guidelines
```

Tests your responses against production support expectations.

### Live conversation mode

```bash
python csm_scenes.py --conversation
```

Starts a REPL-style support simulation and continues until you type `resolve`.

## Data Output

All run artifacts are written to `data/sessions/`:

- `<session_id>.json`: structured transcript and metadata
- `<session_id>.md`: readable conversation log for review

Validation and smoke outputs can be redirected to `validation_data/sessions/` via:

- `CSM_SESSIONS_DIR=validation_data/sessions`

The scenario bank is managed at:

- `data/scenario_bank.jsonl` (10,500+ records)

## Configuration

Environment variables:

- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_TIMEOUT_SECONDS` (default: `45`)
- `CSM_SESSIONS_DIR` (optional override for session output directory)
- `CSM_DEBUG_LLM` (`1` enables verbose LLM response previews during preflight)

Optional CLI flags:

- `--model <name>`: override configured model
- `--max-turns <int>`: cap generated turns (default `16`)
- `--seed <int>`: deterministic scenario sampling/generation

## Project Layout

- `csm_scenes.py`: CLI entrypoint and argument parsing
- `config.py`: environment loading and app configuration
- `engine.py`: mode execution and session persistence
- `scenario_bank.py`: 10k+ scenario generation and sampling
- `llm_client.py`: OpenAI SDK wrapper with fallback behavior
- `guidelines.py`: production guidelines and test scoring
- `models.py`: dataclasses for scenarios, messages, and sessions
- `ui.py`: Rich rendering and interactive prompts

## Reliability Notes

- If OpenAI is unavailable, app falls back to deterministic coaching text so workflows remain operational.
- Scenario bank creation is idempotent and only rebuilds when minimum size is not met.
- Session logs are exported in both machine and human readable formats for auditability.

## Troubleshooting

- Verify `.env` values and API key validity.
- If requests fail, confirm `OPENAI_BASE_URL` points to a reachable OpenAI-compatible endpoint.
- Increase `OPENAI_TIMEOUT_SECONDS` for high-latency networks.

See `ARCHITECTURE.md` and `SUPPORT_GUIDELINES.md` for production behavior and operational expectations.
