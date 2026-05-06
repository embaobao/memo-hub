# MemoHub Hermes Connector

This directory contains the first official `Hermes Connector` for MemoHub.

It implements the Hermes memory provider plugin contract and deliberately keeps
the boundary thin:

- Hermes lifecycle hooks live here.
- Deterministic candidate extraction lives here.
- All storage, query, logs, and cleanup operations go through the MemoHub CLI.

That keeps the data source unified and prevents a Hermes-only memory store from
drifting away from the main MemoHub runtime.
