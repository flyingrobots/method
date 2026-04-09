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
  - "The slice includes regression coverage proving a scoped reference-doc refresh leaves BEARING and CHANGELOG unchanged on branch-local runs."
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
  keep `method sync ship` as the full post-merge ship maneuver, but add
  or define a narrower reference-doc generation path for branch-local
  use.
- Scoped outputs:
  the narrower path should be able to refresh generated reference docs
  such as `docs/CLI.md` and `docs/MCP.md` without editing
  `docs/BEARING.md`, `CHANGELOG.md`, or other ship-only summaries.
- Safety:
  the command or code path should make the scope visible in output so it
  is obvious which generated surfaces were intentionally refreshed.

## Non-goals

- Remove or weaken `method sync ship`.
- Make `BEARING` or `CHANGELOG` branch-local artifacts again.
- Solve every generated-document refresh problem in the same slice.
