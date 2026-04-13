---
title: MCP Reference
generated_at: 2026-04-08T21:17:50.754Z
generator: method sync refs
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

### `method_repair`

Plan or apply bounded doctor-guided repairs for missing directories, missing scaffold files, and frontmatter stubs.

**Parameters:**

- `mode` (required) `string` (plan, apply) — Whether to return a repair plan or apply the same bounded repair set.

### `method_migrate`

Run doctor, apply the bounded repair set, then re-check the workspace so callers can normalize a repo in one step.

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
- `body` (optional) `string` — Optional markdown body. Defaults to the idea text when omitted.
- `source` (optional) `string` — Optional source such as a reviewer, channel, or system.
- `capturedAt` (optional) `string` — Optional capture date in YYYY-MM-DD format.

### `method_backlog_add`

Create a shaped backlog note directly in the requested backlog lane.

**Parameters:**

- `lane` (required) `string` — Destination backlog lane such as `bad-code` or `v1.1.0`.
- `title` (required) `string` — Backlog note title used for frontmatter, heading, and slug derivation.
- `legend` (optional) `string` — Optional legend code prefix such as PROCESS.
- `body` (optional) `string` — Optional markdown body to place under the heading.

### `method_backlog_move`

Move a live backlog note into another backlog lane.

**Parameters:**

- `item` (required) `string` — Backlog path, stem, or slug that resolves to exactly one live backlog note.
- `to` (required) `string` — Destination backlog lane such as `asap`, `bad-code`, or `v1.1.0`.

### `method_backlog_edit`

Update explicit schema-backed metadata on a live backlog note without opening arbitrary frontmatter editing.

**Parameters:**

- `item` (required) `string` — Backlog path, stem, or slug that resolves to exactly one live backlog note.
- `owner` (optional) `string` — Optional owner role to set.
- `clearOwner` (optional) `boolean` — When true, remove the owner field.
- `priority` (optional) `string` — Optional priority to set, such as `high` or `medium`.
- `clearPriority` (optional) `boolean` — When true, remove the priority field.
- `keywords` (optional) `array` — Optional replacement keyword list.
- `clearKeywords` (optional) `boolean` — When true, remove the keywords field.
- `blockedBy` (optional) `array` — Optional replacement `blocked_by` reference list.
- `clearBlockedBy` (optional) `boolean` — When true, remove the `blocked_by` field.
- `blocks` (optional) `array` — Optional replacement `blocks` reference list.
- `clearBlocks` (optional) `boolean` — When true, remove the `blocks` field.

### `method_backlog_query`

Enumerate live backlog items as structured data with explicit frontmatter metadata such as owner, priority, keywords, and declared dependency refs.

**Parameters:**

- `lane` (optional) `string` — Optional backlog lane filter such as `bad-code` or `v1.1.0`.
- `legend` (optional) `string` — Optional legend filter such as PROCESS.
- `priority` (optional) `string` — Optional priority filter such as `medium`.
- `keyword` (optional) `string` — Optional explicit frontmatter keyword filter.
- `owner` (optional) `string` — Optional explicit frontmatter owner filter.
- `ready` (optional) `boolean` — Optional readiness filter. `true` returns items without declared `blocked_by` refs; `false` returns blocked items.
- `hasAcceptanceCriteria` (optional) `boolean` — Optional acceptance-criteria presence filter.
- `blockedBy` (optional) `string` — Optional declared `blocked_by` reference filter.
- `blocks` (optional) `string` — Optional declared `blocks` reference filter.
- `sort` (optional) `string` — Optional backlog query sort mode: `lane`, `priority`, or `path`. Defaults to `lane`.
- `limit` (optional) `integer` — Maximum number of returned items. Defaults to 50 and may not exceed 100.

### `method_backlog_dependencies`

Return the live backlog dependency graph from `blocked_by` / `blocks` frontmatter, optionally focusing on one item, ready work, or the critical path.

**Parameters:**

- `item` (optional) `string` — Optional backlog path, stem, or slug to focus on.
- `readyOnly` (optional) `boolean` — When true, request the unblocked layer-0 backlog items.
- `criticalPath` (optional) `boolean` — When true, include the longest blocker chain to the focused item. Requires `item`.

### `method_next_work`

Return a bounded advisory menu of sensible next backlog items using lane order, declared frontmatter, dependency readiness, current status, and literal BEARING mentions.

**Parameters:**

- `lane` (optional) `string` — Optional backlog lane filter such as `asap` or `v1.1.0`.
- `legend` (optional) `string` — Optional legend filter such as PROCESS.
- `priority` (optional) `string` — Optional priority filter such as `high`.
- `keyword` (optional) `string` — Optional explicit frontmatter keyword filter.
- `owner` (optional) `string` — Optional explicit frontmatter owner filter.
- `includeBlocked` (optional) `boolean` — When true, keep blocked items in the candidate set even when ready work exists.
- `limit` (optional) `integer` — Maximum number of recommendations. Defaults to 3 and may not exceed 10.

### `method_signpost_status`

Report which expected repo signposts exist, which are missing, and which can be initialized by helper commands.

### `method_signpost_init`

Initialize a narrowly supported missing canonical signpost such as BEARING, MCP, CLI, GUIDE, or ARCHITECTURE.

**Parameters:**

- `name` (required) `string` — Canonical signpost name or path, such as BEARING or docs/MCP.md.

### `method_retire`

Retire a live backlog note into the graveyard with an explicit disposition note instead of silently deleting it.

**Parameters:**

- `item` (required) `string` — Live backlog path, stem, or slug that resolves to exactly one backlog note.
- `reason` (required) `string` — Required retirement reason recorded under a graveyard Disposition section.
- `replacement` (optional) `string` — Optional replacement path or successor reference to record in the tombstone.
- `dryRun` (optional) `boolean` — When true, return the planned graveyard move without mutating the repo.

### `method_pull`

Promote a backlog item into the next numbered cycle packet, using release-scoped paths when the backlog item carries release metadata.

**Parameters:**

- `item` (required) `string`

### `method_drift`

Check active cycle playback questions against tests

**Parameters:**

- `cycle` (optional) `string`

### `method_close`

Close an active cycle into its retro packet.

**Parameters:**

- `cycle` (optional) `string`
- `driftCheck` (required) `boolean`
- `outcome` (required) `string` (hill-met, partial, not-met)

### `method_sync_ship`

Perform the Ship Sync maneuver (update CHANGELOG.md and BEARING.md)

### `method_sync_refs`

Refresh generated reference docs without mutating ship-only artifacts such as CHANGELOG.md or docs/BEARING.md.

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
