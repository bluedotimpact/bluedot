"""Versioned instructions; role criteria are supplied separately as search data."""

from pathlib import Path


def prompt_text(name: str) -> str:
    return (Path(__file__).parent / (name + ".txt")).read_text()
