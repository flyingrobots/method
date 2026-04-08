---
title: "Backlog Metadata Single Source Of Truth"
legend: PROCESS
lane: bad-code
---

# Backlog Metadata Single Source Of Truth

Backlog metadata is still split across filename prefixes and YAML
frontmatter. `captureIdea` writes `legend` and `lane` into frontmatter,
but `collectBacklogItems`, `calculateLegendHealth`, and `pullItem` still
derive legend from the filename stem, while `moveBacklogItem` renames the
file without updating frontmatter metadata. That creates silent drift:
the path can say one thing, the YAML can say another, and status/MCP
surfaces may report whichever source they happen to trust.

This is bad code because the repo now has multiple authorities for the
same facts. It is especially hostile to agents, which need one cheap,
stable, machine-readable source instead of filename heuristics plus
special-case inference.

The fix should make frontmatter canonical for backlog metadata, keep
filenames as convenience or display structure, and ensure move/pull/
status/audit flows preserve and validate the YAML fields.
