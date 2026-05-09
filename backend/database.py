import json
import os
from pathlib import Path

TASKS_FILE = Path("tasks.json")
USERS_FILE = Path("users.json")


def _ensure_file(path: Path, default):
    """Create file with default content if it doesn't exist."""
    if not path.exists():
        path.write_text(json.dumps(default, indent=2))


def read_tasks() -> list:
    _ensure_file(TASKS_FILE, [])
    try:
        content = TASKS_FILE.read_text().strip()
        if not content:
            return []
        return json.loads(content)
    except json.JSONDecodeError:
        TASKS_FILE.write_text("[]")
        return []


def write_tasks(data: list) -> None:
    TASKS_FILE.write_text(json.dumps(data, indent=2))


def read_users() -> list:
    _ensure_file(USERS_FILE, [])
    try:
        content = USERS_FILE.read_text().strip()
        if not content:
            return []
        return json.loads(content)
    except json.JSONDecodeError:
        USERS_FILE.write_text("[]")
        return []


def write_users(data: list) -> None:
    USERS_FILE.write_text(json.dumps(data, indent=2))