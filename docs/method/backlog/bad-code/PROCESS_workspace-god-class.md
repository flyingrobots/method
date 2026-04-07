---
title: "Workspace God Class"
legend: PROCESS
lane: bad-code
---

# Workspace God Class

`src/index.ts` Workspace class is 854 lines with 20+ methods covering
backlog ops, cycle lifecycle, witness capture, ship sync, frontmatter
parsing, file rendering, status, and shell execution.

Fix: Extract into focused modules (backlog.ts, cycle.ts, renderers.ts,
frontmatter.ts). Workspace becomes a thin facade.
