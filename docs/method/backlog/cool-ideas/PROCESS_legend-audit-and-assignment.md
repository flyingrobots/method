---
title: "Legend Audit And Assignment"
legend: PROCESS
---

Legend management needs first-class tooling: create legends, assign
backlog items to legends, audit for orphaned items, and list items by
legend and lane. By default, METHOD allows untagged backlog items.
One possible repo-level opt-in would be `method.config.json` with
`require_legend_coverage` set to `true`. If METHOD later implements that
flag, `legend-audit` could report orphaned items and
`method status` could exit non-zero until coverage is restored.

Session context:

- The next move was to define the `PROCESS` and `SYNTH` legends, then
  classify every backlog item under one of those two legends.
- This happened immediately after generating graft's executive summary.
- The agent manually created the legend file, renamed more than twenty
  backlog files, audited for unprefixed items, and regenerated
  `VISION.md`.

What this surfaced:

- Legend operations are tedious and error-prone when done by hand.
- Repos may want full legend coverage, but METHOD should not enforce
  that requirement by default without explicit configuration.
- Tooling should support both lightweight legend use and stricter
  repo-level policies like "no orphaned backlog items."
