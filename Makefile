PYTHON ?= python3
PIP ?= $(PYTHON) -m pip
APP ?= csm_scenes.py
TOPIC ?= Netflix down debugging
MAX_TURNS ?= 6
VALIDATION_SESSIONS_DIR ?= validation_data/sessions

.PHONY: help install install-dev build lint test validate clean \
	run-interview run-simulate run-test-guidelines run-conversation \
	smoke-interview smoke-simulate smoke-test-guidelines smoke-conversation \
	smoke scenario-bank test-openai-live

help:
	@echo "CSM Scenarios Make targets:"
	@echo "  make install              Install runtime dependencies"
	@echo "  make install-dev          Install runtime + dev dependencies"
	@echo "  make build                Compile all python modules"
	@echo "  make lint                 Run Ruff lint checks"
	@echo "  make test                 Run pytest suite"
	@echo "  make test-openai-live     Run live OpenAI integration test only"
	@echo "  make validate             Build + lint + test + smoke checks"
	@echo "  make run-interview        Interactive interview mode"
	@echo "  make run-simulate         Interactive simulate mode (TOPIC=...)"
	@echo "  make run-test-guidelines  Interactive guideline test mode"
	@echo "  make run-conversation     Interactive conversation mode"
	@echo "  make smoke                Non-interactive smoke checks for all modes"
	@echo "  make clean                Remove cache/test artifacts"

install:
	$(PIP) install -r requirements.txt

install-dev: install
	$(PIP) install pytest ruff

build:
	$(PYTHON) -m compileall -q .

lint:
	$(PYTHON) -m ruff check .

test:
	$(PYTHON) -m pytest -q

test-openai-live:
	RUN_OPENAI_INTEGRATION=1 $(PYTHON) -m pytest -q tests/test_llm_client_integration.py -k live_healthcheck

scenario-bank:
	$(PYTHON) -c "from config import load_config; from scenario_bank import ScenarioBank; c=load_config(); ScenarioBank(c).ensure_bank_exists(min_records=10500); print('Scenario bank ready:', c.bank_file)"

run-interview:
	$(PYTHON) $(APP) --interview

run-simulate:
	$(PYTHON) $(APP) --simulate --topic "$(TOPIC)" --max-turns $(MAX_TURNS)

run-test-guidelines:
	$(PYTHON) $(APP) --test-guidelines

run-conversation:
	$(PYTHON) $(APP) --conversation --max-turns $(MAX_TURNS)

smoke-interview:
	printf "Acknowledge impact and set cadence\nCommunicate facts and confidence levels\nTrack customer recovery and SLA trends\n" | CSM_SESSIONS_DIR=$(VALIDATION_SESSIONS_DIR) $(PYTHON) $(APP) --interview

smoke-simulate:
	printf "Acknowledged. I am collecting scope and diagnostics.\nMitigation is active, next update in 20 minutes.\nresolve\n" | CSM_SESSIONS_DIR=$(VALIDATION_SESSIONS_DIR) $(PYTHON) $(APP) --simulate --topic "$(TOPIC)" --max-turns 4

smoke-test-guidelines:
	printf "I acknowledge impact, start mitigation, provide updates, and escalate.\nI gather scope and diagnostics and share the next update.\nI prioritize stabilization, avoid assumptions, and keep communication clear.\n" | CSM_SESSIONS_DIR=$(VALIDATION_SESSIONS_DIR) $(PYTHON) $(APP) --test-guidelines

smoke-conversation:
	printf "I understand the impact and I am scoping affected users now.\nMitigation is in progress and escalation is active. Next update in 20 minutes.\nresolve\n" | CSM_SESSIONS_DIR=$(VALIDATION_SESSIONS_DIR) $(PYTHON) $(APP) --conversation --max-turns 4

smoke: smoke-interview smoke-simulate smoke-test-guidelines smoke-conversation

validate: build lint test smoke

clean:
	rm -rf __pycache__ .pytest_cache .ruff_cache validation_data
