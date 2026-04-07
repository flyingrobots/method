---
title: "No Depth Limit in Directory Walk"
legend: PROCESS
lane: bad-code
---

# No Depth Limit in Directory Walk

`collectMarkdownFiles()` in `src/index.ts` and `collectFiles()` in
`src/drift.ts` recursively walk directories with no depth limit or
symlink protection. A symlink loop causes infinite recursion and crash.

Fix: Add maxDepth parameter (default 10) and skip symlinks.
