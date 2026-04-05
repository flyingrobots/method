---
title: "Two-way GitHub Sync"
legend: PROCESS
---

# Two-way GitHub Sync

Source backlog item: `docs/method/backlog/up-next/PROCESS_two-way-github-sync.md`
Legend: PROCESS

## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Extend the GitHub adapter to support "pulling" state from GitHub back to
the local filesystem. This ensures that changes made on the GitHub web
interface (such as updating labels, adding comments, or closing issues)
can be reflected in the local backlog items, keeping the two systems in
sync while maintaining the filesystem as the final authority.

## Playback Questions

### Human

- [ ] `method sync github --pull` (or similar) updates local backlog files
  with data from GitHub.
- [ ] Local files reflect GitHub status (e.g., if an issue is closed on
  GitHub, the local file is moved to a 'closed' or 'done' state, or
  updated in place).
- [ ] GitHub labels are synced back to the YAML frontmatter.
- [ ] Top-level GitHub comments (or a summary) are appended to the
  local markdown body.

### Agent

- [ ] `GitHubAdapter.pullBacklog()` is implemented and tested with mocks.
- [ ] `Workspace.updateBacklogItem()` (or similar) handles the move/update
  logic safely.
- [ ] `tests/github-adapter.test.ts` proves that remote changes are
  correctly applied locally.

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
- [ ] Conflicts resolution (filesystem always wins if both changed).

## Backlog Context

Implement two-way synchronization for the GitHub adapter, allowing
labels, comments, and issue status to sync back from GitHub to the local
filesystem backlog.
