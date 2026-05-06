from __future__ import annotations

import json
from pathlib import Path
from typing import Any

CONFIG_FILE_NAME = "memohub-provider.json"

DEFAULT_CONFIG: dict[str, Any] = {
    "memohub_command": ["memohub"],
    "project_id": "default",
    "language": "auto",
    "test_validation": True,
}


def config_path(hermes_home: str | Path) -> Path:
    return Path(hermes_home).expanduser() / CONFIG_FILE_NAME


def load_provider_config(hermes_home: str | Path) -> dict[str, Any]:
    path = config_path(hermes_home)
    if not path.exists():
        return dict(DEFAULT_CONFIG)
    return {**DEFAULT_CONFIG, **json.loads(path.read_text(encoding="utf-8"))}


def save_provider_config(values: dict[str, Any], hermes_home: str | Path) -> dict[str, Any]:
    path = config_path(hermes_home)
    path.parent.mkdir(parents=True, exist_ok=True)
    next_config = {**load_provider_config(hermes_home), **values}
    path.write_text(json.dumps(next_config, indent=2, ensure_ascii=False), encoding="utf-8")
    return next_config
