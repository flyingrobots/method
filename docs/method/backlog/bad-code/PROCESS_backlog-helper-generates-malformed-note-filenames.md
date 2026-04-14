---
title: "Backlog helper generates malformed note filenames"
legend: PROCESS
lane: bad-code
---

# Backlog helper generates malformed note filenames

The METHOD backlog creation helper can emit malformed filenames when a note title already carries a legend-style ID such as `DX-022` or `DF-028`.

Observed behavior from real use in another METHOD workspace:
- input title: `DX-022 — Layout Inspector Overlay`
- generated stem: `DX_dx-022-layout-inspector-overlay.md`

Expected behavior:
- generated stem: `DX-022-layout-inspector-overlay.md`

Why this is bad-code:
- it forces manual renames after otherwise simple backlog-add operations
- it makes the filesystem less trustworthy than the frontmatter title
- it introduces avoidable churn into backlog maintenance flows
- it breaks the repo's clean ID-first filename convention for notes that already have explicit IDs

Fix direction:
Normalize filename generation so legend-style IDs in titles are preserved as canonical stems instead of being duplicated or lowercased into an extra slug fragment.
