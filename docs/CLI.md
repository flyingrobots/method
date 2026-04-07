---
title: "CLI Reference"
generated_at: 2026-04-07T05:30:14.481Z
generator: "method sync ship"
generated_from_commit: "03d889ddbe57ecb6b336ba2a62815f863f85bfd1"
provenance_level: artifact_history
---

# CLI Reference

The `method` command is the primary interface for METHOD workspace
operations. Run `method help` for a quick summary or
`method help <command>` for command-specific usage.

## Commands

<!-- generate:cli-commands -->
### `method init [path]`

Scaffold a METHOD workspace in the given directory.

### `method inbox <idea> [--legend CODE] [--title TITLE]`

Capture a raw idea in docs/method/backlog/inbox/.

### `method pull <item>`

Promote a backlog item into the next numbered design cycle.

### `method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]`

Close an active cycle into docs/method/retro/.

### `method status`

Show backlog lanes, active cycles, and legend health.

### `method drift [cycle]`

Check active cycle playback questions against test descriptions in tests/.
First cut scans tests/**/*.test.* and tests/**/*.spec.* only.

### `method mcp`

Start an MCP (Model Context Protocol) server on stdio.

### `method sync github|ship [options]`

GitHub Options:
  --push                      Update GitHub issues with local changes (default).
  --pull                      Update local backlog with GitHub changes (labels, comments, status).
Perform Ship Sync or synchronize the backlog with GitHub Issues.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (bad arguments, missing workspace, failed operation) |
| 2 | Drift found (from `method drift`) |
<!-- /generate -->

## Configuration

The CLI reads `.method.json` from the workspace root for:

- `paths` — custom directory layout (see `ARCHITECTURE.md`)
- `github_token` / `github_repo` — GitHub adapter credentials
- Environment overrides: `GITHUB_TOKEN`, `GITHUB_REPO`
