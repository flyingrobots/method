---
title: "Async Exec Refactor"
legend: PROCESS
---

# Async Exec Refactor

The Workspace.execCommand method currently uses synchronous execSync, 
which blocks the event loop and makes the CLI feel stuttery during 
witness capture. Refactor to an asynchronous implementation.
