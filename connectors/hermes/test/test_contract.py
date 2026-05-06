from __future__ import annotations

from pathlib import Path

from memohub_provider import register
from memohub_provider.provider import MemoHubMemoryProvider


class FakeClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict]] = []

    def command_available(self) -> bool:
        return True

    def config_show(self):
        self.calls.append(("config_show", {}))
        return {"configVersion": "unified-memory-1"}

    def inspect(self):
        self.calls.append(("inspect", {}))
        return {"runtime": "unified-memory-runtime"}

    def channel_open(self, **kwargs):
        self.calls.append(("channel_open", kwargs))
        return {
            "success": True,
            "entry": {
                "channelId": "hermes:primary:memo-hub",
                "actorId": kwargs["actor_id"],
                "source": kwargs["source"],
                "projectId": kwargs["project_id"],
                "purpose": kwargs["purpose"],
                "sessionId": kwargs.get("session_id"),
            },
        }

    def query_view(self, **kwargs):
        self.calls.append(("query_view", kwargs))
        return {
            "selfContext": [{"object": {"content": [{"text": f"{kwargs['view']} summary"}]}}],
            "projectContext": [{"object": {"content": [{"text": "project summary"}]}}],
            "globalContext": [],
            "conflictsOrGaps": [],
        }

    def list_memory(self, **kwargs):
        self.calls.append(("list_memory", kwargs))
        return {"memories": [{"content": [{"text": "global hint"}]}]}

    def add_memory(self, **kwargs):
        self.calls.append(("add_memory", kwargs))
        return {"success": True, "eventId": f"evt_{len(self.calls)}"}

    def logs_query(self, **kwargs):
        self.calls.append(("logs_query", kwargs))
        return {"entries": []}

    def clean_test_preview(self, **kwargs):
        self.calls.append(("clean_test_preview", kwargs))
        return {"success": True, "dryRun": True}


def test_contract_and_config_roundtrip(tmp_path: Path) -> None:
    provider = MemoHubMemoryProvider(client=FakeClient())
    schema = provider.get_config_schema()
    saved = provider.save_config({"project_id": "memo-hub"}, str(tmp_path))

    assert provider.name == "memohub"
    assert isinstance(register(), MemoHubMemoryProvider)
    assert provider.is_available() is True
    assert any(field["key"] == "memohub_command" for field in schema)
    assert saved["project_id"] == "memo-hub"
    assert (tmp_path / "memohub-provider.json").exists()


def test_initialize_prefetch_and_tool_calls() -> None:
    client = FakeClient()
    provider = MemoHubMemoryProvider(client=client, config={"project_id": "memo-hub"})

    initialized = provider.initialize("session-1", project_id="memo-hub")
    summary = provider.prefetch("project habits")
    tools = provider.get_tool_schemas()
    status = provider.handle_tool_call("memohub_status", {})

    assert initialized["channel"]["channelId"] == "hermes:primary:memo-hub"
    assert summary["channel"]["projectId"] == "memo-hub"
    assert summary["actorSummary"]
    assert any(tool["name"] == "memohub_query_memory" for tool in tools)
    assert status["runtime"] == "unified-memory-runtime"
