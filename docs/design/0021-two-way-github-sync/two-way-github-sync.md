---
title: "Two-way GitHub Sync"
legend: PROCESS
---

# Two-way GitHub Sync

Source backlog item: `docs/method/backlog/up-next/PROCESS_two-way-github-sync.md`
Legend: PROCESS

## Sponsors

- Human: Backlog Operator
- Agent: Sync Automator

## Hill

Extend the GitHub adapter to support full two-way synchronization between
the local filesystem and GitHub Issues. The filesystem remains the
authority for local content; the adapter will:
1. **Push**: Update existing GitHub issues if the local title or body has
   changed since the last sync. (This is the default action for 
   `sync github`).
2. **Pull**: Update local backlog items with remote labels, status
   (Open/Closed), and top-level comments to keep the local context rich.

If both `--push` and `--pull` are provided, they run sequentially: 
local changes are pushed first, then remote updates are pulled.

## Playback Questions

### Human

- [ ] `method sync github --push` (or default) updates the title and
  description of an existing GitHub issue if the local file changes.
- [ ] `method sync github --pull` updates local backlog files with data
  from GitHub (labels, status, comments).
- [ ] `method sync github --push --pull` runs both operations 
  sequentially (Push then Pull).
- [ ] Local files reflect GitHub status (e.g., if an issue is closed on
  GitHub, the local file is updated or moved).

### Agent

- [ ] `GitHubAdapter.pushBacklog()` and `GitHubAdapter.pullBacklog()` are
  implemented and tested with mocks.
- [ ] `tests/github-adapter.test.ts` proves that both remote-to-local and
  local-to-remote updates work correctly.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Syncing remote comments
  locally ensures the full context of an item is available in a single
  linear markdown file.
- Non-visual or alternate-reading expectations: Same as one-way sync.

## Localization and Directionality

- Locale / wording / formatting assumptions: Standard English for synced
  content headers.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The mapping of
  GitHub states to local lane movements must be deterministic.
- What must be attributable, evidenced, or governed: The source of the
  synced data (GitHub) must be clear.

## Non-goals

- [ ] Real-time sync (this remains a manual command-triggered move).
- [ ] Conflicts resolution (filesystem wins for title/body content on 
  push; metadata like labels and comments are enriched on pull).

## Backlog Context

Implement two-way synchronization for the GitHub adapter, allowing
labels, comments, and issue status to sync back from GitHub to the local
filesystem backlog.
