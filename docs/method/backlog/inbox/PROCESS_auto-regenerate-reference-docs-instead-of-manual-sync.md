---
title: "Auto-regenerate reference docs instead of manual sync"
legend: PROCESS
lane: inbox
---

# Auto-regenerate reference docs instead of manual sync

CLI.md, MCP.md, and ARCHITECTURE.md are generated but require manual 'method sync refs' to stay current. If they're generated, they should regenerate automatically — either on build, pre-commit, or as part of the test suite. Stale generated docs are worse than no generated docs because they look authoritative while being wrong.
