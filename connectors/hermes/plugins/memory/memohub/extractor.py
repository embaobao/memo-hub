from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Set

PREFERENCE_PATTERNS = [r"偏好", r"习惯", r"默认", r"以后都", r"\bprefer\b", r"\balways\b"]
ACTIVITY_PATTERNS = [r"正在做", r"刚完成", r"接下来", r"阻塞", r"\bworking on\b", r"\bnext\b"]
FACT_PATTERNS = [r"项目约定", r"架构决定", r"事实是", r"以.+为准", r"\bdecision\b", r"\bproject fact\b"]
CLARIFY_PATTERNS = [r"纠正", r"澄清", r"不是", r"应该是", r"\bclarif", r"\binstead\b"]


def extract_memory_candidates(
    *,
    user_message: Optional[str],
    assistant_message: Optional[str],
    project_id: str,
    channel_id: str,
    session_id: Optional[str] = None,
    task_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    for message in [user_message, assistant_message]:
        if not message:
            continue
        for line in split_candidates(message):
            for category in detect_categories(line):
                candidates.append(
                    {
                        "text": line,
                        "category": category,
                        "project_id": project_id,
                        "channel_id": channel_id,
                        "session_id": session_id,
                        "task_id": task_id,
                    }
                )
    return dedupe_candidates(candidates)


def split_candidates(text: str) -> List[str]:
    parts = re.split(r"[\n。！？!?]+", text)
    return [part.strip() for part in parts if part and len(part.strip()) >= 6]


def detect_categories(text: str) -> List[str]:
    categories: List[str] = []
    if matches_any(CLARIFY_PATTERNS, text):
        categories.append("clarification")
    if matches_any(PREFERENCE_PATTERNS, text):
        categories.append("habit" if "习惯" in text else "preference")
    if matches_any(ACTIVITY_PATTERNS, text):
        categories.append("activity")
    if matches_any(FACT_PATTERNS, text):
        categories.append("project_fact")
    return categories


def category_to_cli_hint(category: str) -> str:
    return {
        "preference": "preference",
        "habit": "habit",
        "activity": "activity",
        "project_fact": "project-fact",
        "clarification": "clarification",
    }[category]


def matches_any(patterns: List[str], text: str) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def dedupe_candidates(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: Set[str] = set()
    deduped: List[Dict[str, Any]] = []
    for candidate in candidates:
        key = f"{candidate['category']}::{candidate['text'].strip().lower()}"
        if key in seen:
            continue
        seen.add(key)
        deduped.append(candidate)
    return deduped
