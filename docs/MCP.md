---
title: "MCP Reference"
generated_at: 2026-04-07T05:30:14.482Z
generator: "method sync ship (generateMcpReference)"
generated_from_commit: "03d889ddbe57ecb6b336ba2a62815f863f85bfd1"
provenance_level: artifact_history
---

# MCP Reference

METHOD exposes its workspace operations through a Model Context
Protocol (MCP) server. Start it with `method mcp` — it communicates
over stdio using JSON-RPC.

## Workspace Parameter

Every tool requires a `workspace` parameter: the absolute path to the
METHOD workspace root directory. This makes the server
workspace-agnostic — a single instance can serve multiple projects.

## Tools

### `method_status`

Get the current status of the METHOD workspace (backlog lanes, active cycles, legend health)

### `method_inbox`

Capture a new raw idea into the inbox

**Parameters:**

- `idea` (required) `string`
- `legend` (optional) `string`
- `title` (optional) `string`

### `method_pull`

Promote a backlog item into the next numbered cycle

**Parameters:**

- `item` (required) `string`

### `method_drift`

Check active cycle playback questions against tests

**Parameters:**

- `cycle` (optional) `string`

### `method_close`

Close an active cycle into a retro

**Parameters:**

- `cycle` (optional) `string`
- `driftCheck` (required) `boolean`
- `outcome` (required) `string` (hill-met, partial, not-met)

### `method_sync_ship`

Perform the Ship Sync maneuver (update CHANGELOG.md and BEARING.md)

### `method_sync_github`

Synchronize backlog with GitHub Issues

**Parameters:**

- `push` (optional) `boolean` — Update GitHub issues with local changes (default: true)
- `pull` (optional) `boolean` — Update local backlog with GitHub changes

### `method_capture_witness`

Automate terminal evidence capture for a cycle

**Parameters:**

- `cycle` (optional) `string`
