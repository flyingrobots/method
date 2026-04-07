---
title: "CLI Reference"
generated_from_commit: "fe47f5bb944a4035cfd2c0692e438a2174206103"
---

# CLI Reference

The `method` command is the primary interface for METHOD workspace
operations. Run `method help` for a quick summary or
`method help <command>` for command-specific usage.

## Commands

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

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (bad arguments, missing workspace, failed operation) |
| 2 | Drift found (from `method drift`) |
