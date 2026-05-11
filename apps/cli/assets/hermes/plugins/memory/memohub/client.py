from __future__ import annotations

import json
import shlex
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence


class MemoHubClientError(RuntimeError):
    pass


@dataclass
class MemoHubClient:
    command: List[str]
    cwd: Optional[str] = None
    language: str = "auto"

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> "MemoHubClient":
        raw_command = config.get("memohub_command", ["memohub"])
        command = normalize_command(raw_command)
        return cls(
            command=command,
            cwd=config.get("working_directory"),
            language=config.get("language", "auto"),
        )

    def run_json(self, args: Sequence[str]) -> Any:
        completed = subprocess.run(
            self.build_command(args),
            cwd=self.cwd,
            capture_output=True,
            text=True,
            check=False,
        )
        if completed.returncode != 0:
            raise MemoHubClientError(
                f"MemoHub command failed: {' '.join(self.build_command(args))}\n"
                f"stdout: {completed.stdout}\nstderr: {completed.stderr}"
            )
        stdout = completed.stdout.strip()
        if not stdout:
            return {}
        try:
            return json.loads(stdout)
        except json.JSONDecodeError as error:
            raise MemoHubClientError(f"MemoHub output is not valid JSON: {stdout}") from error

    def build_command(self, args: Sequence[str]) -> List[str]:
        command = list(self.command)
        command.extend(["--lang", self.language, *args])
        return command

    def inspect(self) -> Any:
        return self.run_json(["inspect", "--json"])

    def config_show(self) -> Any:
        return self.run_json(["config", "show", "--json"])

    def command_available(self) -> bool:
        head = self.command[0] if self.command else ""
        if not head:
            return False
        return shutil.which(head) is not None or Path(head).expanduser().exists()

    def channel_open(
        self,
        *,
        actor_id: str,
        source: str,
        project_id: str,
        purpose: str = "primary",
        session_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        task_id: Optional[str] = None,
        channel_id: Optional[str] = None,
    ) -> Any:
        args = [
            "channel",
            "open",
            "--actor",
            actor_id,
            "--source",
            source,
            "--project",
            project_id,
            "--purpose",
            purpose,
            "--json",
        ]
        if session_id:
            args.extend(["--session", session_id])
        if workspace_id:
            args.extend(["--workspace", workspace_id])
        if task_id:
            args.extend(["--task", task_id])
        if channel_id:
            args.extend(["--channel", channel_id])
        return self.run_json(args)

    def add_memory(
        self,
        *,
        text: str,
        source: str,
        project_id: str,
        channel_id: str,
        category: str,
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
    ) -> Any:
        args = [
            "add",
            text,
            "--source",
            source,
            "--project",
            project_id,
            "--channel",
            channel_id,
            "--category",
            category,
            "--json",
        ]
        if session_id:
            args.extend(["--session", session_id])
        if task_id:
            args.extend(["--task", task_id])
        return self.run_json(args)

    def query_view(
        self,
        *,
        query: str,
        view: str,
        actor_id: str,
        project_id: str,
        limit: int = 5,
    ) -> Any:
        return self.run_json(
            [
                "query",
                query,
                "--view",
                view,
                "--actor",
                actor_id,
                "--project",
                project_id,
                "--limit",
                str(limit),
                "--json",
            ]
        )

    def list_memory(
        self,
        *,
        perspective: str,
        actor_id: Optional[str] = None,
        project_id: Optional[str] = None,
        limit: int = 20,
    ) -> Any:
        args = ["ls", "--perspective", perspective, "--limit", str(limit), "--json"]
        if actor_id:
            args.extend(["--actor", actor_id])
        if project_id:
            args.extend(["--project", project_id])
        return self.run_json(args)

    def logs_query(
        self,
        *,
        tail: int = 50,
        channel_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Any:
        args = ["logs", "query", "--tail", str(tail), "--json"]
        if channel_id:
            args.extend(["--channel", channel_id])
        if session_id:
            args.extend(["--session", session_id])
        return self.run_json(args)

    def clean_test_preview(self, *, actor_id: str, project_id: str) -> Any:
        return self.run_json(
            [
                "data",
                "clean",
                "--actor",
                actor_id,
                "--project",
                project_id,
                "--purpose",
                "test",
                "--dry-run",
                "--json",
            ]
        )


def normalize_command(raw_command: Any) -> List[str]:
    if isinstance(raw_command, str):
        return shlex.split(raw_command)
    if isinstance(raw_command, Sequence):
        return [str(part) for part in raw_command]
    raise MemoHubClientError(f"Unsupported memohub_command: {raw_command!r}")
