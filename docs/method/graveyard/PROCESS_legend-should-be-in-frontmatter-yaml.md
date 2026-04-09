---
title: "Legend Should Be In Frontmatter YAML"
legend: PROCESS
lane: graveyard
---

# Legend Should Be In Frontmatter YAML

Require backlog items to carry their legend in YAML frontmatter instead of relying only on filename prefixes or inferred metadata. Commands that create, move, or audit backlog items should preserve and validate the `legend` field so legend-aware workflows have a single canonical source.

## Disposition

Retired as a separate backlog item after cycle
`0030-backlog-metadata-single-source-of-truth`. Backlog items now carry
legend metadata in YAML and METHOD operations preserve or backfill that
frontmatter, so this no longer needs to stay open as standalone work.
