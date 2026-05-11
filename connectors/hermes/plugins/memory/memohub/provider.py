from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

from .client import MemoHubClient, MemoHubClientError
from .config import DEFAULT_CONFIG, load_provider_config, save_provider_config
from .extractor import category_to_cli_hint, extract_memory_candidates
from .formatter import format_prefetch_summary, format_sync_turn_result


class MemoHubMemoryProvider:
    def __init__(self, *, client: Optional[MemoHubClient] = None, config: Optional[Dict[str, Any]] = None) -> None:
        self._client = client
        self._config = {**DEFAULT_CONFIG, **(config or {})}
        self._active_channel: Optional[Dict[str, Any]] = None
        self._session_id: Optional[str] = None
        self._hermes_home: Optional[str] = None
        self._pending_query: Optional[str] = None
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="memohub-hermes")
        self._last_sync_future: Optional[Future[Dict[str, Any]]] = None
        self._sync_lock = Lock()

    @property
    def name(self) -> str:
        return "memohub"

    def is_available(self) -> bool:
        try:
            client = self._require_client()
            return client.command_available() and bool(client.config_show())
        except Exception:
            return False

    def get_config_schema(self) -> List[Dict[str, Any]]:
        # 安装命令已经预写 provider 配置；setup 阶段不再额外提示用户输入。
        return []

    def save_config(self, values: Dict[str, Any], hermes_home: str) -> Dict[str, Any]:
        self._hermes_home = hermes_home
        self._config = save_provider_config(values, hermes_home)
        self._client = MemoHubClient.from_config(self._config)
        return self._config

    def initialize(self, session_id: str, **kwargs: Any) -> dict[str, Any]:
        self._session_id = session_id
        project_id = resolve_project_id(kwargs, self._config)
        purpose = resolve_purpose(kwargs)
        workspace_id = kwargs.get("workspace_id") or kwargs.get("workspaceId")
        task_id = kwargs.get("task_id") or kwargs.get("taskId")

        result = self._require_client().channel_open(
            actor_id="hermes",
            source="hermes",
            project_id=project_id,
            purpose=purpose,
            session_id=session_id,
            workspace_id=workspace_id,
            task_id=task_id,
        )
        self._active_channel = result.get("entry", result)
        return {
            "success": result.get("success", True),
            "channel": self._active_channel,
            "sessionId": session_id,
        }

    def system_prompt_block(self) -> str:
        return (
            "MemoHub is Hermes' shared long-term memory center. "
            "Recall order is self -> project -> global, and every write stays bound to the active channel."
        )

    def queue_prefetch(self, query: Optional[str]) -> Dict[str, Any]:
        self._pending_query = query
        return {"queued": True, "query": query}

    def prefetch(self, query: Optional[str] = None) -> Dict[str, Any]:
        channel = self._require_channel()
        project_id = str(channel["projectId"])
        actor_id = str(channel["actorId"])
        profile_view = self._require_client().query_view(
            query=query or "profile habits preferences",
            view="agent_profile",
            actor_id=actor_id,
            project_id=project_id,
        )
        recent_view = self._require_client().query_view(
            query=query or "recent activity current work",
            view="recent_activity",
            actor_id=actor_id,
            project_id=project_id,
        )
        project_view = self._require_client().query_view(
            query=query or "project facts conventions architecture",
            view="project_context",
            actor_id=actor_id,
            project_id=project_id,
        )
        global_memories = self._require_client().list_memory(perspective="global", limit=5)
        return format_prefetch_summary(
            channel=channel,
            profile_view=profile_view,
            recent_view=recent_view,
            project_view=project_view,
            global_memories=normalize_list_result(global_memories),
        )

    def sync_turn(
        self,
        user_message: str,
        assistant_message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        metadata = metadata or {}
        with self._sync_lock:
            self._last_sync_future = self._executor.submit(
                self._sync_turn_worker,
                user_message,
                assistant_message,
                metadata,
            )
        return {
            "queued": True,
            "success": True,
            "channelId": self._active_channel["channelId"] if self._active_channel else None,
            "message": "MemoHub sync_turn has been queued for background write.",
        }

    def on_pre_compress(self, messages: List[Any]) -> Dict[str, Any]:
        channel = self._require_channel()
        text = "\n".join(extract_message_text(message) for message in messages[-4:] if extract_message_text(message))
        candidates = extract_memory_candidates(
            user_message=text,
            assistant_message=None,
            project_id=str(channel["projectId"]),
            channel_id=str(channel["channelId"]),
            session_id=self._session_id,
        )
        return self._write_candidates(channel, candidates)

    def on_session_end(self, messages: List[Any]) -> Dict[str, Any]:
        channel = self._require_channel()
        text = "\n".join(extract_message_text(message) for message in messages[-6:] if extract_message_text(message))
        summary = preview_text(text) or "Hermes session ended without durable summary content."
        written = self._require_client().add_memory(
            text=f"Session summary: {summary}",
            source="hermes",
            project_id=str(channel["projectId"]),
            channel_id=str(channel["channelId"]),
            category="activity",
            session_id=self._session_id,
        )
        return {"success": True, "written": [written], "channelId": channel["channelId"]}

    def on_memory_write(self, action: str, target: str, content: str) -> Dict[str, Any]:
        channel = self._require_channel()
        category = infer_manual_write_category(action, target)
        result = self._require_client().add_memory(
            text=f"{target}: {content}",
            source="hermes",
            project_id=str(channel["projectId"]),
            channel_id=str(channel["channelId"]),
            category=category,
            session_id=self._session_id,
        )
        return {"success": True, "written": [result], "channelId": channel["channelId"]}

    def shutdown(self) -> Dict[str, Any]:
        self._pending_query = None
        self._session_id = None
        self._executor.shutdown(wait=False, cancel_futures=True)
        return {"success": True}

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "memohub_status",
                "description": "Show MemoHub CLI runtime status for the current Hermes connector.",
                "input_schema": {"type": "object", "properties": {}},
            },
            {
                "name": "memohub_query_memory",
                "description": "Query one named MemoHub memory view for the current Hermes actor/project.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "view": {"type": "string"},
                        "query": {"type": "string"},
                        "limit": {"type": "integer", "default": 5},
                    },
                    "required": ["view", "query"],
                },
            },
            {
                "name": "memohub_list_memory",
                "description": "List governed MemoHub memory from actor, project, or global perspective.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "perspective": {"type": "string", "enum": ["actor", "project", "global"]},
                        "limit": {"type": "integer", "default": 20},
                    },
                    "required": ["perspective"],
                },
            },
            {
                "name": "memohub_logs_query",
                "description": "Read recent MemoHub logs for the active channel or session.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "tail": {"type": "integer", "default": 50},
                    },
                },
            },
            {
                "name": "memohub_clean_test_preview",
                "description": "Dry-run test cleanup preview for the current Hermes actor/project.",
                "input_schema": {"type": "object", "properties": {}},
            },
        ]

    def handle_tool_call(self, name: str, args: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        args = args or {}
        channel = self._require_channel()
        if name == "memohub_status":
            return self._require_client().inspect()
        if name == "memohub_query_memory":
            return self._require_client().query_view(
                query=str(args["query"]),
                view=str(args["view"]),
                actor_id=str(channel["actorId"]),
                project_id=str(channel["projectId"]),
                limit=int(args.get("limit", 5)),
            )
        if name == "memohub_list_memory":
            perspective = str(args["perspective"])
            return self._require_client().list_memory(
                perspective=perspective,
                actor_id=str(channel["actorId"]) if perspective == "actor" else None,
                project_id=str(channel["projectId"]) if perspective == "project" else None,
                limit=int(args.get("limit", 20)),
            )
        if name == "memohub_logs_query":
            return self._require_client().logs_query(
                tail=int(args.get("tail", 50)),
                channel_id=str(channel["channelId"]),
                session_id=self._session_id,
            )
        if name == "memohub_clean_test_preview":
            return self._require_client().clean_test_preview(
                actor_id=str(channel["actorId"]),
                project_id=str(channel["projectId"]),
            )
        raise MemoHubClientError(f"Unknown MemoHub Hermes tool: {name}")

    def _write_candidates(self, channel: Dict[str, Any], candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
        written: List[Dict[str, Any]] = []
        skipped: List[Dict[str, Any]] = []
        for candidate in candidates:
            if not candidate.get("text"):
                skipped.append(candidate)
                continue
            result = self._require_client().add_memory(
                text=str(candidate["text"]),
                source="hermes",
                project_id=str(channel["projectId"]),
                channel_id=str(channel["channelId"]),
                category=category_to_cli_hint(str(candidate["category"])),
                session_id=str(candidate.get("session_id") or self._session_id or ""),
                task_id=str(candidate.get("task_id") or "") or None,
            )
            written.append({"category": candidate["category"], "text": candidate["text"], "result": result})
        return format_sync_turn_result(channel=channel, written=written, skipped=skipped)

    def _sync_turn_worker(
        self,
        user_message: str,
        assistant_message: str,
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        channel = self._ensure_initialized(metadata)
        candidates = extract_memory_candidates(
            user_message=user_message,
            assistant_message=assistant_message,
            project_id=str(channel["projectId"]),
            channel_id=str(channel["channelId"]),
            session_id=metadata.get("session_id") or metadata.get("sessionId") or self._session_id,
            task_id=metadata.get("task_id") or metadata.get("taskId"),
        )
        return self._write_candidates(channel, candidates)

    def _ensure_initialized(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if self._active_channel:
            return self._active_channel
        session_id = metadata.get("session_id") or metadata.get("sessionId") or self._session_id or "hermes-session"
        result = self.initialize(str(session_id), **metadata)
        return result["channel"]

    def _require_channel(self) -> Dict[str, Any]:
        if not self._active_channel:
            raise MemoHubClientError("MemoHub Hermes provider is not initialized. Call initialize() first.")
        return self._active_channel

    def _require_client(self) -> MemoHubClient:
        if self._client:
            return self._client
        if self._hermes_home:
            self._config = load_provider_config(self._hermes_home)
        self._client = MemoHubClient.from_config(self._config)
        return self._client


def resolve_project_id(kwargs: Dict[str, Any], config: Dict[str, Any]) -> str:
    return str(
        kwargs.get("project_id")
        or kwargs.get("projectId")
        or config.get("project_id")
        or Path.cwd().name
    )


def resolve_purpose(kwargs: Dict[str, Any]) -> str:
    purpose = str(kwargs.get("purpose") or kwargs.get("channel_purpose") or "primary")
    return purpose if purpose in {"primary", "test", "session", "connector", "import"} else "primary"


def extract_message_text(message: Any) -> str:
    if isinstance(message, str):
        return message
    if isinstance(message, dict):
        return str(message.get("content") or message.get("text") or "")
    return str(getattr(message, "content", "") or getattr(message, "text", "") or "")


def preview_text(text: str, limit: int = 160) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 3]}..."


def normalize_list_result(result: Any) -> dict[str, Any]:
    if isinstance(result, dict):
        return result
    if isinstance(result, list):
        return {"memories": result}
    return {"memories": []}


def infer_manual_write_category(action: str, target: str) -> str:
    normalized = f"{action} {target}".lower()
    if "clar" in normalized:
        return "clarification"
    if "habit" in normalized:
        return "habit"
    if "prefer" in normalized or "pref" in normalized:
        return "preference"
    if "activity" in normalized or "recent" in normalized:
        return "activity"
    return "project-fact"
