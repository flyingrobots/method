---
title: Backlog Authoring Command
legend: PROCESS
lane: graveyard
owner: METHOD maintainers
priority: high
acceptance_criteria:
  - The note defines a bounded CLI and MCP surface for creating backlog notes directly in an explicit lane.
  - The contract supports title, body, legend, and lane without requiring manual markdown file creation.
  - Write behavior stays explicit and inspectable, with stable structured results for agents.
  - The first slice names how frontmatter is seeded so repo truth stays aligned after creation.
---

# Backlog Authoring Command

## Disposition

Already implemented and shipped prior to v2.0.0 release.

## Original Proposal

METHOD currently offers `method inbox <idea>`, but not a first-class
way to create a shaped backlog note directly in an intentional lane.
That pushes humans and agents back into manual file creation for common
operations such as adding a `bad-code`, `up-next`, or release-target
item.

## Proposed Contract

- Surface:
  ship a CLI command such as
  `method backlog add --lane <lane> --title <title> [--legend <code>] [--body-file <path>] [--json]`
  plus an MCP tool such as `method_backlog_add`.
- Output:
  CLI `--json` and MCP should return the same structured result with at
  least `path`, `lane`, `legend`, `title`, `stem`, `slug`, and `ok`.
- Write semantics:
  creation must write a real markdown note under the requested backlog
  lane, seed frontmatter fields like `title`, `legend`, and `lane`, and
  preserve the provided body without extra hidden templating.
- Lane handling:
  the command must accept canonical lanes and repo-defined custom lanes
  such as `v1.1.0`, but it must reject traversal or malformed lane
  names before any write.
- Relationship to inbox:
  `method inbox` remains the raw capture path. This command is for
  intentional authoring once the shape is already known.

## Why It Matters

- The current split is inspect with METHOD, mutate by editing files.
- Arbitrary-lane authoring is one of the most common missing agent
  operations during real repo work.
- Repo-defined lanes only stay trustworthy if METHOD can write them on
  purpose instead of treating them as shell-only behavior.

## Non-goals

- Auto-prioritize or auto-pull a note just because it was created.
- Replace `method inbox` as the zero-ceremony capture path.
- Bundle lane-move or retire behavior into the first authoring slice.
