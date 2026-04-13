---
title: Doctor Repair Command
legend: PROCESS
lane: graveyard
owner: METHOD maintainers
priority: high
acceptance_criteria:
  - The note defines a bounded repair surface for safe doctor findings such as missing directories, missing scaffold files, and repairable frontmatter stubs.
  - The contract separates planning (`--plan`) from mutation (`--apply`) so callers can inspect the proposed repairs first.
  - The design names how structured repair hints feed the repair command instead of duplicating diagnosis rules by hand.
  - CLI and MCP return stable structured results describing findings selected, files touched, and anything left unresolved.
---

# Doctor Repair Command

## Disposition

Already implemented and shipped prior to v2.0.0 release.

## Original Proposal

`method doctor` is now good at diagnosing repo-shape problems, but it
still stops at prose. The next manual step is often obvious:
recreate a missing directory, restore a required file scaffold, or add a
minimal frontmatter stub so the packet is at least structurally valid.

That is exactly the kind of bounded repo repair METHOD should be able to
plan explicitly and, when asked, execute safely.

## Proposed Contract

- Surface:
  ship a CLI command such as
  `method repair --plan` and `method repair --apply`
  plus an MCP tool such as `method_repair`.
- Repair classes:
  the first slice should handle safe deterministic repairs only:
  missing directories, missing scaffold files, and minimal frontmatter
  stubs for METHOD packet markdown.
- Planning first:
  `--plan` must show the exact repairs that would be made. `--apply`
  must reuse that same bounded repair set rather than inventing new
  behavior on the fly.
- Structured inputs:
  the implementation should build on structured repair hints from doctor
  results so agents do not need to scrape prose fix strings.
- Result shape:
  return the selected issues, planned or applied repairs, touched paths,
  skipped findings, and `ok`.

## Why It Matters

- Diagnosis without a first-class repair path leaves METHOD's mutation
  surface thin in the exact place agents most often need help.
- A repair plan is safer and more inspectable than pushing every caller
  back into ad hoc filesystem edits.
- The command would make dogfooding doctor much tighter inside METHOD on
  itself and across other repos.

## Non-goals

- Silent auto-repair during `method doctor`.
- Predictive multi-step refactors that go beyond bounded repo-shape
  fixes.
- Repairing arbitrary business logic or source-code defects.
