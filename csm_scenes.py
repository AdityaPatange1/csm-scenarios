"""CSM Scenarios terminal application entrypoint."""

from __future__ import annotations

import argparse
import sys

from config import AppConfig, load_config
from engine import (
    run_conversation_mode,
    run_guideline_test_mode,
    run_interview_mode,
    run_simulation_mode,
)
from scenario_bank import ScenarioBank
from ui import print_error, print_header


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="csm_scenes.py",
        description="CSM Scenarios: production-grade customer success simulation app.",
    )

    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        "--interview",
        action="store_true",
        help="Conduct a CSM interview to test core customer success concepts.",
    )
    mode_group.add_argument(
        "--simulate",
        action="store_true",
        help="Run a production incident simulation on a specific topic.",
    )
    mode_group.add_argument(
        "--test-guidelines",
        action="store_true",
        help="Test user responses against support behavior guidelines.",
    )
    mode_group.add_argument(
        "--conversation",
        action="store_true",
        help="Run real-time CSM REPL conversation until issue resolution.",
    )

    parser.add_argument(
        "--topic",
        type=str,
        default="",
        help="Topic for simulation mode, for example: 'Netflix down debugging'.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="",
        help="Override model from .env for this run.",
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=16,
        help="Maximum generated turns for simulation and conversation modes.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed for deterministic scenario selection.",
    )
    return parser


def validate_args(args: argparse.Namespace) -> None:
    if args.simulate and not args.topic.strip():
        raise ValueError("--simulate requires --topic.")
    if args.max_turns <= 0:
        raise ValueError("--max-turns must be greater than 0.")


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        validate_args(args)
        config: AppConfig = load_config(model_override=args.model or None)
        bank = ScenarioBank(config=config, seed=args.seed)
        bank.ensure_bank_exists(min_records=10_500)
    except Exception as exc:  # pylint: disable=broad-except
        print_error(f"Startup failed: {exc}")
        return 1

    print_header("CSM Scenarios")

    if args.interview:
        return run_interview_mode(config=config, bank=bank)
    if args.simulate:
        return run_simulation_mode(
            config=config,
            bank=bank,
            topic=args.topic.strip(),
            max_turns=args.max_turns,
        )
    if args.test_guidelines:
        return run_guideline_test_mode(config=config, bank=bank)
    if args.conversation:
        return run_conversation_mode(config=config, bank=bank, max_turns=args.max_turns)

    parser.print_help(sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
