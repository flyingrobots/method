---
title: "MCP Reference"
---

# MCP Reference

METHOD exposes its workspace operations through a Model Context
Protocol (MCP) server. Start it with `method mcp` — it communicates
over stdio using JSON-RPC.

## Connection

```bash
method mcp
```

The server speaks MCP protocol version `2024-11-05`. Configure it in
your MCP client (e.g., `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "method": {
      "command": "node",
      "args": ["dist/cli.js", "mcp"]
    }
  }
}
```

## Workspace Parameter

Every tool requires a `workspace` parameter: the absolute path to the
METHOD workspace root directory. This makes the server
workspace-agnostic — a single instance can serve multiple projects.

```json
{ "workspace": "/Users/you/git/your-project" }
```

## Tools

### `method_status`

Get the current workspace status as structured JSON.

**Parameters:** `workspace` (required)

**Returns:** JSON with `root`, `backlog` (items per lane),
`activeCycles`, and `legendHealth`.

### `method_inbox`

Capture a new raw idea into the inbox.

**Parameters:**
- `workspace` (required) — workspace root path
- `idea` (required) — the idea text (becomes file body)
- `legend` (optional) — legend code to prefix the filename
- `title` (optional) — override heading and slug

**Returns:** relative path to the created file.

### `method_pull`

Promote a backlog item into the next numbered cycle.

**Parameters:**
- `workspace` (required) — workspace root path
- `item` (required) — backlog item name (filename, stem, or
  case-insensitive match)

**Returns:** cycle name and design doc path.

### `method_drift`

Check active cycle playback questions against test descriptions.

**Parameters:**
- `workspace` (required) — workspace root path
- `cycle` (optional) — specific cycle name

**Returns:** drift report text. `isError: true` if drift is found.

### `method_close`

Close an active cycle into a retro with witness capture.

**Parameters:**
- `workspace` (required) — workspace root path
- `driftCheck` (required) — boolean, must be true
- `outcome` (required) — `"hill-met"`, `"partial"`, or `"not-met"`
- `cycle` (optional) — specific cycle name

**Returns:** cycle name and retro doc path.

### `method_sync_ship`

Perform the Ship Sync maneuver (update CHANGELOG.md and BEARING.md).

**Parameters:** `workspace` (required)

**Returns:** list of updated files and newly shipped cycles.

### `method_sync_github`

Synchronize backlog with GitHub Issues. Requires `github_token` and
`github_repo` in `.method.json`.

**Parameters:**
- `workspace` (required) — workspace root path
- `push` (optional) — update remote from local (default: true)
- `pull` (optional) — update local from remote

**Returns:** per-item sync results.

### `method_capture_witness`

Capture a verification witness for a cycle (test output + drift
results).

**Parameters:**
- `workspace` (required) — workspace root path
- `cycle` (optional) — specific cycle name

**Returns:** path to the generated witness file.

## Error Handling

All tools return `isError: true` with a text message on failure.
Common errors:

- `workspace is required` — missing workspace parameter
- `not a METHOD workspace` — path doesn't contain METHOD structure
- `No active cycles found` — no open design docs without retros
- `Cannot close a cycle without completing the drift check` —
  `driftCheck` must be true
