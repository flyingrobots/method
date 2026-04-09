---
title: "Typed Frontmatter Access"
legend: PROCESS
lane: bad-code
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note names the current lossy behavior in src/frontmatter.ts: parsed YAML values are stringified, which discards arrays, booleans, and richer scalar distinctions."
  - "The proposal defines a bounded typed-read surface for frontmatter without requiring every existing caller to migrate in one slice."
  - "The contract keeps simple update behavior explicit, including what types are supported for round-trip writes."
  - "Regression coverage proves fields such as acceptance_criteria arrays and boolean-like frontmatter survive typed reads without collapsing to plain strings."
---

# Typed Frontmatter Access

METHOD's frontmatter parser currently converts every parsed YAML value
to `String(value)` before handing it to callers. That makes the read
surface simple, but it is also lossy: arrays, booleans, and richer YAML
values collapse into plain strings.

That tradeoff is no longer cheap. Backlog items now carry structured
fields such as `acceptance_criteria`, and newer agent-first features
like backlog query or next-work want real metadata rather than
hand-reconstructed strings.

## Current Bad Behavior

- `acceptance_criteria` arrays lose structure on read.
- Boolean-like fields cannot be distinguished from arbitrary strings
  once they pass through the current helper.
- Agents and higher-level features have to re-parse raw markdown or
  avoid using the existing frontmatter API when they need structured
  truth.

## Proposed Contract

- Add a typed read path:
  keep the current string-oriented helpers for compatibility, but add a
  typed frontmatter read surface that returns YAML-native values for the
  bounded scalar and collection types METHOD actually uses.
- Supported first-cut types:
  strings, booleans, numbers when intentionally present, and arrays of
  strings for fields like `acceptance_criteria` or `source_files`.
- Compatibility:
  existing callers that only need simple string metadata do not have to
  migrate in the same slice.
- Round-trip expectations:
  typed reads should pair with an explicit typed-write or merge story so
  supported field shapes do not silently degrade when written back out.

## Non-goals

- Support every obscure YAML feature.
- Migrate every existing frontmatter caller in one sweep.
- Turn frontmatter into a free-form database with no document-level
  contract.
