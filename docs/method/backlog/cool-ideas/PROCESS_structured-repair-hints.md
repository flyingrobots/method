---
title: "Structured Repair Hints"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines a bounded structured repair-hint contract for diagnostics such as doctor findings."
  - "The proposal includes machine-usable fields beyond prose, such as repair kind, candidate command, or edit scope."
  - "The contract keeps human-readable fix text while adding structured data for agents instead of replacing the current prose."
  - "The design names at least one immediate consumer such as MCP callers that want to turn doctor findings into repair plans."
---

# Structured Repair Hints

METHOD diagnostics currently speak in good human prose, but agents still
have to parse that prose to decide whether the next action is "run a
command", "create a directory", "restore a file", or "edit
frontmatter". That is workable, but it is a weak fit for an agent-first
tool that already exposes structured MCP results.

The next step is not full auto-repair. It is a better contract for the
repair suggestion itself.

## Proposed Contract

- Shared shape:
  extend bounded diagnostic results such as doctor issues with optional
  fields like `repair_kind`, `suggested_command`, `target_path`, or
  `edit_scope`.
- Human + agent parity:
  keep the current prose `fix` text for humans, but add structured
  repair hints so MCP callers do not need to scrape English text.
- Bounded vocabulary:
  start with a small enum of repair kinds such as `create_directory`,
  `restore_file`, `edit_config`, `fix_frontmatter`, or
  `inspect_external_tooling`.
- Immediate applicability:
  the first slice should cover existing doctor findings rather than
  inventing a repo-wide repair DSL.

## Non-goals

- Auto-execute repairs without explicit caller intent.
- Predict arbitrary multi-step refactors from a single finding.
- Replace explanation text with opaque machine-only metadata.
