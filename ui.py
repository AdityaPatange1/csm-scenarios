"""Rich terminal UI helpers."""

from __future__ import annotations

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.text import Text

console = Console()


def print_header(title: str) -> None:
    console.print(
        Panel.fit(
            Text(title, style="bold bright_cyan"),
            border_style="cyan",
            padding=(1, 2),
        )
    )


def print_markdown(markdown_text: str) -> None:
    console.print(Markdown(markdown_text))


def print_info(message: str) -> None:
    console.print(f"[bold blue]INFO[/bold blue] {message}")


def print_success(message: str) -> None:
    console.print(f"[bold green]SUCCESS[/bold green] {message}")


def print_warning(message: str) -> None:
    console.print(f"[bold yellow]WARN[/bold yellow] {message}")


def print_error(message: str) -> None:
    console.print(f"[bold red]ERROR[/bold red] {message}")


def ask_user(prompt_text: str, default: str | None = None) -> str:
    return Prompt.ask(prompt_text, default=default or "")


def render_scorecard(items: list[tuple[str, str]]) -> None:
    table = Table(title="Run Scorecard", show_lines=False, border_style="green")
    table.add_column("Metric", style="bold")
    table.add_column("Value", style="cyan")
    for metric, value in items:
        table.add_row(metric, value)
    console.print(table)
