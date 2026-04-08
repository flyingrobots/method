---
title: "Dist Output Pruning"
legend: PROCESS
lane: bad-code
---

# Dist Output Pruning

The checked-in `dist/` tree still contains `workspace.*` artifacts even
though there is no longer a matching `src/workspace.ts`. That means
build output can retain dead files across refactors and package stale
implementation surfaces that are no longer real.

This is bad code because published artifacts stop being a trustworthy
projection of current source. The build or release path should either
clean `dist/` before emit or explicitly validate that `dist/` matches
live source modules.
