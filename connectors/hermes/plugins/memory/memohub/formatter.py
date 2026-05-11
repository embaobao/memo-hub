from __future__ import annotations

from typing import Any


def format_prefetch_summary(
    *,
    channel: dict[str, Any],
    profile_view: dict[str, Any],
    recent_view: dict[str, Any],
    project_view: dict[str, Any],
    global_memories: dict[str, Any],
) -> dict[str, Any]:
    actor_summary = collect_texts(profile_view.get("selfContext", [])) + collect_texts(
        recent_view.get("selfContext", [])
    )
    project_summary = collect_texts(project_view.get("projectContext", []))
    global_hints = collect_texts(global_memories.get("memories", []))
    conflicts = collect_conflicts(profile_view) + collect_conflicts(recent_view) + collect_conflicts(
        project_view
    )

    return {
        "channel": {
            "channelId": channel.get("channelId"),
            "actorId": channel.get("actorId"),
            "source": channel.get("source"),
            "projectId": channel.get("projectId"),
            "purpose": channel.get("purpose"),
            "sessionId": channel.get("sessionId"),
        },
        "actorSummary": actor_summary[:5],
        "projectSummary": project_summary[:5],
        "globalHints": global_hints[:3],
        "conflictsOrGaps": conflicts,
        "nextActions": [
            "Use sync_turn to capture durable preferences, activity, project facts, and clarifications.",
            "Use MemoHub logs or dry-run cleanup when onboarding validation does not match expectation.",
        ],
    }


def format_sync_turn_result(
    *,
    channel: dict[str, Any],
    written: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "success": True,
        "channelId": channel.get("channelId"),
        "writtenCount": len(written),
        "skippedCount": len(skipped),
        "written": written,
        "skipped": skipped,
    }


def collect_texts(items: list[dict[str, Any]]) -> list[str]:
    texts: list[str] = []
    for item in items:
        if "object" in item:
            text = (((item.get("object") or {}).get("content") or [{}])[0]).get("text", "")
        else:
            text = (((item.get("content") or [{}])[0]).get("text", ""))
        if text:
            texts.append(preview_text(str(text)))
    return texts


def collect_conflicts(view: dict[str, Any]) -> list[str]:
    conflicts = []
    for item in view.get("conflictsOrGaps", []):
        if isinstance(item, dict):
            conflicts.append(str(item.get("message", item)))
        else:
            conflicts.append(str(item))
    return conflicts


def preview_text(text: str, limit: int = 120) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 3]}..."
