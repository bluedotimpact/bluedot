"""Shared file/schema helpers. All runtime dependencies are Python standard library."""

import hashlib
import json
import os
import re
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCAL = ROOT / "data"


def read_json(path):
    return json.loads(Path(path).read_text())


def write_json(path, value, *, exclusive=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    if exclusive:
        with path.open("x") as f:
            f.write(content)
        return
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".save-")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run_path(local, name):
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", name):
        raise ValueError("Run name must contain only letters, digits, underscores, or hyphens")
    return Path(local) / "runs" / name


def require(condition, message):
    if not condition:
        raise ValueError(message)
