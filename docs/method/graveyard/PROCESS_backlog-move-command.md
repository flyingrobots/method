---
title: Backlog Move Command
legend: PROCESS
lane: graveyard
owner: METHOD maintainers
priority: high
acceptance_criteria:
  - The note defines a bounded CLI and MCP surface for moving a live backlog item between live lanes.
  - The contract preserves frontmatter lane truth instead of relying on path inference.
  - The first slice supports canonical lanes and repo-defined lanes such as v1.1.0.
  - The result shape names the source path, destination path, destination lane, and touched files.
---

# Backlog Move Command

## Disposition

Already implemented and shipped prior to v2.0.0 release.

## Original Proposal

METHOD already knows how to read backlog items by path, slug, or stem,
and the internal API can move them, but there is no first-class CLI or
MCP mutation for everyday reprioritization across live lanes.

That leaves a common maintenance task outside the agent surface even
though the move itself is deterministic and filesystem-shaped.

## Proposed Contract

- Surface:
  ship a CLI command such as
  `method backlog move <item> --to <lane> [--json]`
  plus an MCP tool such as `method_backlog_move`.
- Resolution:
  `<item>` should resolve the same way `method pull` does: path, stem,
  or slug that maps to exactly one live backlog file.
- Write semantics:
  move the file to the requested lane directory, update frontmatter
  `lane`, preserve legend/title/body, and create the destination lane
  directory when needed.
- Safety:
  ambiguous matches, malformed lane names, or destination collisions
  must fail before any write.
- Scope boundary:
  retirement to graveyard remains the job of a separate retire command,
  not an overloaded generic move.

## Why It Matters

- Repo truth should not depend on humans remembering to rename a file
  and patch YAML together.
- Agents need a native move surface for inbox triage, release-target
  shaping, and backlog hygiene.
- This is the missing sibling to `method backlog add`.

## Non-goals

- Retire or delete backlog items.
- Bulk reorder an entire lane in one command.
- Infer destination lanes from heuristics.
