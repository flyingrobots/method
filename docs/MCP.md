---
title: MCP Reference
generated_at: 2026-04-08T21:17:50.754Z
generator: method sync ship
generated_from_commit: ecde6ac00e798d68bf69b2c2bfb9044ad44d47e9
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

<!-- generate:mcp-tools -->
### `method_doctor`

Inspect METHOD workspace health and report concrete problems with suggested fixes, even when the workspace is partially broken.

### `method_review_state`

Get PR review / merge-readiness state for the current branch or an explicit PR. `pr` and `currentBranch` are mutually exclusive; when `pr` is omitted, current-branch resolution is the default behavior.

**Parameters:**

- `pr` (optional) `integer` — Explicit PR number to inspect
- `currentBranch` (optional) `boolean` — Resolve the PR from the current branch (default when pr is omitted)

### `method_status`

Get the current status of the METHOD workspace (backlog lanes, active cycles, legend health)

**Parameters:**

- `summary` (optional) `boolean` — Return a compact structured summary instead of the fully expanded workspace status (default: false)

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
<!-- /generate -->

## Error Handling

All tools return a human-readable text message in `content`.
Machine-readable callers should consume `structuredContent`.

On success, `structuredContent` includes:

- `tool`
- `ok: true`
- `result`

On failure, tools set `isError: true` and `structuredContent` includes:

- `tool`
- `ok: false`
- `error.message`

Common errors: `workspace is required`, `not a METHOD workspace`,
`No active cycles found`.
