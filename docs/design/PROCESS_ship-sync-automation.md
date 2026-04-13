---
title: "Ship Sync Automation"
legend: PROCESS
---

# Ship Sync Automation

Source backlog item: `docs/method/backlog/up-next/PROCESS_ship-sync-automation.md`
Legend: PROCESS

## Sponsors

- Human: Backlog Operator
- Agent: Sync Automator

## Hill

Implement a `method sync ship` command that automates the "Ship Sync
Maneuver" defined in Cycle 0015. This command will append newly closed
cycles to `CHANGELOG.md` and refresh `docs/BEARING.md` based on the
current repository state, reducing the manual coordination effort
required after a merge to `main`.

## Playback Questions

### Human

- [ ] A new `method sync ship` command identifies closed cycles that are
  not yet in the `CHANGELOG.md` and appends them.
- [ ] `docs/BEARING.md` is automatically refreshed with the latest
  ships and the next items in the backlog.

### Agent

- [ ] `src/index.ts` provides a `shipSync()` method that performs the
  orchestration.
- [ ] `tests/ship-sync.test.ts` proves that the sync is idempotent (running
  it twice doesn't duplicate entries).
- [ ] The command correctly handles workspaces with no new ships.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Automating the sync
  ensures that the repository's public signposts are always consistent
  with the underlying cycle history, reducing cognitive load for
  readers.
- Non-visual or alternate-reading expectations: Consistent, automated
  formatting in signposts makes them more predictable for screen
  readers and agents.

## Localization and Directionality

- Locale / wording / formatting assumptions: The command uses the
  standard English templates for `BEARING` and `CHANGELOG`.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The selection of
  "new" cycles to add to the changelog must be deterministic.
- What must be attributable, evidenced, or governed: The sync operation
  should report exactly which cycles were synchronized.

## Non-goals

- [ ] Automating the `git push` to `main` (the operator should still
  review the changes before pushing).
- [ ] Refreshing `docs/VISION.md` (the Executive Summary Protocol remains
  a manual/agent move due to its high-synthesis nature).

## Backlog Context

Automate the 'Ship Sync Maneuver' (updating BEARING.md and CHANGELOG.md)
via a new CLI command to reduce manual coordination effort after
merges.
