from __future__ import annotations

import argparse
import json
from typing import Any

from .config import load_provider_config
from .provider import MemoHubMemoryProvider


def register_cli(subparsers) -> None:
    parser = subparsers.add_parser("memohub", help="Debug MemoHub Hermes memory provider")
    parser.add_argument("action", choices=["status", "prefetch", "sync-turn"])
    parser.add_argument("--hermes-home", required=True)
    parser.add_argument("--session-id", default="debug-session")
    parser.add_argument("--project-id")
    parser.add_argument("--query", default="current memory state")
    parser.add_argument("--user-message")
    parser.add_argument("--assistant-message")
    parser.set_defaults(handler=_handle_debug_command)


def _handle_debug_command(args) -> None:
    config = load_provider_config(args.hermes_home)
    provider = MemoHubMemoryProvider(config=config)
    provider.initialize(args.session_id, project_id=args.project_id)

    if args.action == "status":
        result: dict[str, Any] = {"available": provider.is_available(), "tools": provider.get_tool_schemas()}
    elif args.action == "prefetch":
        result = provider.prefetch(args.query)
    else:
        result = provider.sync_turn(
            user_message=args.user_message or "",
            assistant_message=args.assistant_message or "",
            metadata={"project_id": args.project_id, "session_id": args.session_id},
        )

    print(json.dumps(result, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description="MemoHub Hermes provider debug CLI")
    subparsers = parser.add_subparsers(dest="command")
    register_cli(subparsers)
    args = parser.parse_args()
    handler = getattr(args, "handler", None)
    if handler is None:
        parser.print_help()
        return
    handler(args)
