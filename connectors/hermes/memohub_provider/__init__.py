from .provider import MemoHubMemoryProvider


def register(ctx=None):
    return MemoHubMemoryProvider()


__all__ = ["MemoHubMemoryProvider", "register"]
