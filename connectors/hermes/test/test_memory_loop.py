from __future__ import annotations

from plugins.memory.memohub.extractor import extract_memory_candidates
from plugins.memory.memohub.provider import MemoHubMemoryProvider


class RecordingClient:
    def __init__(self) -> None:
        self.writes: list[dict] = []

    def inspect(self):
        return {"runtime": "unified-memory-runtime"}

    def channel_open(self, **kwargs):
        return {
            "success": True,
            "entry": {
                "channelId": "hermes:test:memo-hub:validation",
                "actorId": kwargs["actor_id"],
                "source": kwargs["source"],
                "projectId": kwargs["project_id"],
                "purpose": kwargs["purpose"],
                "sessionId": kwargs.get("session_id"),
            },
        }

    def query_view(self, **kwargs):
        return {"selfContext": [], "projectContext": [], "globalContext": [], "conflictsOrGaps": []}

    def list_memory(self, **kwargs):
        return {"memories": []}

    def add_memory(self, **kwargs):
        self.writes.append(kwargs)
        return {"success": True, "eventId": f"evt_{len(self.writes)}"}

    def logs_query(self, **kwargs):
        return {"entries": []}

    def clean_test_preview(self, **kwargs):
        return {"success": True, "dryRun": True}


def test_extractor_finds_multi_category_candidates() -> None:
    candidates = extract_memory_candidates(
        user_message="以后都先查自己记忆。我正在做 Hermes 接入，项目约定是使用 Connector -> Channel -> Memory。",
        assistant_message="澄清一下，不是多轨模型，应该是统一记忆模型。",
        project_id="memo-hub",
        channel_id="hermes:test:memo-hub:validation",
        session_id="session-1",
    )

    categories = {candidate["category"] for candidate in candidates}
    assert {"preference", "activity", "project_fact", "clarification"} <= categories


def test_sync_turn_and_session_end_write_back_to_memohub() -> None:
    client = RecordingClient()
    provider = MemoHubMemoryProvider(client=client, config={"project_id": "memo-hub"})
    provider.initialize("session-1", project_id="memo-hub")

    sync_result = provider.sync_turn(
        user_message="以后都先查自己记忆。我正在做 Hermes 接入。",
        assistant_message="项目约定是使用 Connector -> Channel -> Memory。",
        metadata={"project_id": "memo-hub", "session_id": "session-1"},
    )
    provider._last_sync_future.result(timeout=3)
    end_result = provider.on_session_end(
        [{"content": "今天完成了 Hermes 纯记忆闭环验证，并确认使用统一记忆模型。"}]
    )

    assert sync_result["queued"] is True
    assert end_result["success"] is True
    assert any(write["category"] == "activity" for write in client.writes)
