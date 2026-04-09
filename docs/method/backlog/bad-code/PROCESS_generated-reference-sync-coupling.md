---
title: "Generated Reference Sync Coupling"
legend: PROCESS
lane: bad-code
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note names the current bad behavior: refreshing generated reference docs like docs/MCP.md or docs/CLI.md currently requires `method sync ship`, which also mutates repo-level ship surfaces such as BEARING and CHANGELOG."
  - "The proposal defines a bounded way to regenerate reference docs without touching ship-only artifacts that are supposed to move on merged main."
  - "The contract keeps full `method sync ship` as the post-merge main maneuver rather than weakening that workflow."
  - "The contract specifies regression expectations proving a scoped reference-doc refresh leaves BEARING and CHANGELOG unchanged on branch-local runs."
---

# Generated Reference Sync Coupling

Refreshing generated reference docs during PR work currently requires
running `method sync ship`, even when the only intended output is a file
like `docs/MCP.md` or `docs/CLI.md`. That full ship maneuver also
touches repo-level artifacts such as `docs/BEARING.md` and
`CHANGELOG.md`, which are explicitly supposed to reflect merged `main`
state rather than branch-local review work.

In practice, that means a small documentation regeneration step creates
unrelated branch noise that then has to be manually reverted. This is
the sort of coupling that wastes review time and makes agents less
confident about running the generator they actually need.

## Proposed Contract

- Current bad behavior:
  regenerating generated reference docs on a feature branch should not
  require mutating ship-only artifacts whose truth is tied to merged
  `main`.
- Desired split:
  keep `method sync ship` as the full post-merge ship maneuver, and add
  a dedicated branch-local reference-doc refresh surface such as
  `method sync refs`, backed by a TypeScript helper such as
  `generateReferenceDocs()`, for regenerating reference docs without
  mutating ship-only artifacts.
- Scoped outputs:
  `method sync refs` should refresh the current generated reference
  signposts exactly: `ARCHITECTURE.md`, `docs/CLI.md`, `docs/MCP.md`,
  and `docs/GUIDE.md`. It must not edit ship-only artifacts such as
  `docs/BEARING.md` or `CHANGELOG.md`.
- Safety:
  `method sync refs` MUST print the list of refreshed targets, and
  `generateReferenceDocs()` MUST return the same target list for MCP or
  other callers. That surfaced scope must name the exact refreshed
  targets (`ARCHITECTURE.md`, `docs/CLI.md`, `docs/MCP.md`,
  `docs/GUIDE.md`) and exclude ship-only files such as
  `docs/BEARING.md` and `CHANGELOG.md`.

## Non-goals

- Remove or weaken `method sync ship`.
- Make `BEARING` or `CHANGELOG` branch-local artifacts again.
- Solve every generated-document refresh problem in the same slice.
