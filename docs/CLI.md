---
title: CLI Reference
generated_at: 2026-04-08T21:17:50.746Z
generator: method sync refs
generated_from_commit: ecde6ac00e798d68bf69b2c2bfb9044ad44d47e9
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

### `method doctor [--json]`

Inspect METHOD workspace health without mutating it.

### `method migrate [--json]`

Run doctor, apply the bounded repair set, then re-check the workspace.

### `method inbox <idea> [--legend CODE] [--title TITLE] [--body-file PATH] [--source TEXT] [--captured-at YYYY-MM-DD] [--json]`

Capture raw input in docs/method/backlog/inbox/.

### `method backlog add --lane LANE --title TITLE [--legend CODE] [--body-file PATH] [--json]`

Create a shaped backlog note directly in the requested backlog lane.

### `method backlog move <item> --to LANE [--json]`

Move a live backlog note into another backlog lane.

### `method backlog edit <item> [--owner TEXT|--clear-owner] [--priority VALUE|--clear-priority] [--keyword VALUE ...|--clear-keywords] [--blocked-by REF ...|--clear-blocked-by] [--blocks REF ...|--clear-blocks] [--json]`

Update explicit schema-backed backlog metadata on a live backlog note. Repeat `--keyword`, `--blocked-by`, or `--blocks` to replace list fields.

### `method backlog list [--lane LANE] [--legend CODE] [--priority VALUE] [--keyword VALUE] [--owner VALUE] [--ready|--blocked] [--has-acceptance-criteria|--missing-acceptance-criteria] [--blocked-by REF] [--blocks REF] [--sort lane|priority|path] [--limit N] [--json]`

Return structured backlog items and explicit frontmatter metadata such as owner, priority, keywords, blocks, blocked_by, readiness, and acceptance criteria presence.

### `method backlog deps [item] [--ready] [--critical-path] [--json]`

Inspect live backlog dependencies from `blocked_by` / `blocks` frontmatter.
Use `--ready` to show unblocked work, or pass `<item> --critical-path` to show the longest blocker chain to one item.

### `method retire <item> --reason TEXT [--replacement PATH] [--dry-run] [--yes] [--json]`

Retire a live backlog note into the graveyard with an explicit disposition record.

### `method signpost status [--json]`

Report which expected repo signposts exist, which are missing, and which can be initialized by helper commands.

### `method signpost init <name> [--json]`

Initialize a narrowly supported missing canonical signpost such as BEARING or MCP.

### `method repair (--plan | --apply) [--json]`

Plan or apply bounded doctor-guided repairs for missing directories, scaffold files, and frontmatter stubs.

### `method next [--lane LANE] [--legend CODE] [--priority VALUE] [--keyword VALUE] [--owner VALUE] [--include-blocked] [--limit N] [--json]`

Return a bounded advisory menu of sensible next backlog items using lane order, declared frontmatter, dependency readiness, and literal BEARING mentions.

### `method pull <item>`

Promote a backlog item into the next numbered cycle packet. Release-tagged work scaffolds under docs/releases/<version>/.

### `method close [cycle] [--drift-check yes|no] --outcome hill-met|partial|not-met`

Close an active cycle into its retro packet. `--outcome` is required.

### `method status`

Show backlog lanes, active cycles, and legend health.

### `method drift [cycle]`

Check active cycle playback questions against test descriptions in tests/.
First cut scans tests/**/*.test.* and tests/**/*.spec.* only.

### `method review-state [--pr NUMBER | --current-branch] [--json]`

Query PR review / merge-readiness state for the current branch or an explicit PR.
Defaults to --current-branch when no selector flag is provided.

### `method mcp`

Start an MCP (Model Context Protocol) server on stdio.

### `method sync github|ship|refs [options]`

GitHub Options:
  --push                      Update GitHub issues with local changes (default).
  --pull                      Update local backlog with GitHub changes (labels, comments, status).
Perform Ship Sync, refresh generated reference docs, or synchronize the backlog with GitHub Issues.

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
