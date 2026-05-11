from __future__ import annotations

from typing import Any, Optional

from .provider import MemoHubMemoryProvider


def register(ctx: Optional[Any] = None):
    provider = MemoHubMemoryProvider()
    if ctx is not None and hasattr(ctx, "register_memory_provider"):
        ctx.register_memory_provider(provider)
    return provider


def register_cli(subparsers):
    # Hermes 会在 provider 初始化前单独扫描 cli.py；这里必须惰性导入，避免循环导入把插件判成未安装。
    from .cli import register_cli as _register_cli

    return _register_cli(subparsers)


__all__ = ["MemoHubMemoryProvider", "register", "register_cli"]
