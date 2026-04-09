---
title: "Retire Command"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines a bounded CLI and MCP surface for retiring live backlog items into docs/method/graveyard/."
  - "The contract requires an explicit human- or agent-supplied reason so retirement never becomes silent deletion."
  - "The proposed output preserves historical context by moving the item and recording a disposition note rather than just removing the file."
  - "The write behavior stays explicit, inspectable, and safe for agent use."
---

# Retire Command

Retiring stale or superseded backlog items is currently a manual repo
edit: move the file into `docs/method/graveyard/`, update its lane,
write a disposition note, and often refresh any inventory that points at
it. That is exactly the kind of bounded, repetitive filesystem maneuver
METHOD should be able to perform natively.

The goal is not a destructive delete. The goal is an explicit
graveyarding action that preserves history and records why the work is
no longer active.

## Proposed Contract

- Surface:
  add a CLI command such as
  `method retire <item> --reason <text> [--replacement <path>] [--json]`
  plus an MCP tool such as `method_retire`.
- Scope:
  the first slice should handle live backlog items only. Design docs,
  retros, and other repo artifacts may follow later, but they should not
  be bundled into the first implementation.
- Input:
  `<item>` may be a backlog path, stem, or slug that resolves to exactly
  one live backlog file. Ambiguous matches must fail before any write.
- Write semantics:
  retiring an item must move it into `docs/method/graveyard/`, change
  frontmatter `lane` to `graveyard`, prepend or update a `## Disposition`
  section with the supplied reason, and preserve the original proposal
  content below that tombstone.
- Historical linkage:
  if `--replacement` or an equivalent MCP field is supplied, record that
  path in the disposition note so resurrection or supersession is
  searchable later.
- Safety:
  CLI write mode should support `--dry-run` and require explicit
  confirmation through `--yes` before mutating the repo. MCP should use
  the standard explicit-mutation posture already used by other write
  tools.
- Result shape:
  CLI `--json` and MCP should return the same structured result with at
  least `source_path`, `graveyard_path`, `reason`, `replacement`,
  `updated_files`, and `ok`.

## Why It Matters

- Agents and humans both need a safe way to say "this note is stale"
  without silently erasing history.
- The repo already treats the graveyard as a first-class memory surface;
  a native retire command would make that discipline cheaper to follow.
- Dogfooding this flow would reduce stale backlog pressure and make
  current-priority signposts less likely to point at already-invalid
  work.

## Non-goals

- Hard-delete backlog items without a tombstone.
- Auto-retire items just because they look old or unreferenced.
- Fold arbitrary backlog reprioritization into the same command.
