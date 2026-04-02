# Legend Audit And Assignment

Legend management needs first-class tooling: create legends, assign backlog items to legends, audit for orphaned items, and list items by legend and lane. Keep exhaustive legend coverage optional at the METHOD level unless a repo opts into it explicitly.

Session context:

- After generating `graft`'s executive summary, the next move was to
  define a new `CORE` legend and classify every backlog item under
  either `CORE` or `WARP`.
- The agent manually created the legend file, renamed more than twenty
  backlog files, audited for unprefixed items, and regenerated
  `VISION.md`.

What this surfaced:

- Legend operations are tedious and error-prone when done by hand.
- Repos may want full legend coverage, but METHOD should not silently
  require that by default.
- Tooling should support both lightweight legend use and stricter
  repo-level policies like "no orphaned backlog items."
