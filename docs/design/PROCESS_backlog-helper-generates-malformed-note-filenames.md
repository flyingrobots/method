---
title: "Backlog helper generates malformed note filenames"
legend: "PROCESS"
cycle: "PROCESS_backlog-helper-generates-malformed-note-filenames"
source_backlog: "docs/method/backlog/bad-code/PROCESS_backlog-helper-generates-malformed-note-filenames.md"
---

# Backlog helper generates malformed note filenames

## Hill

createBacklogItem strips the legend prefix from the slug when the title
already contains it, preventing duplicated stems like `DX_dx-022-...`.

## Playback Questions

### Human

- [ ] Does createBacklogItem avoid duplicating the legend prefix when the title already contains it?

### Agent

- [ ] Does createBacklogItem avoid duplicating the legend prefix when the title already contains it?
