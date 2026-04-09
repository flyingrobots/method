---
title: "Workspace Operation Split"
legend: PROCESS
lane: bad-code
---

# Workspace Operation Split

`Workspace` still carries too many responsibilities in one class:
initialization checks, backlog capture, pull/close flow, witness
generation, ship sync, status collection, frontmatter mutation, backlog
moves, cycle resolution, and shell command execution. The repo already
called this out in the `0029-bad-code-cleanup` retro as remaining debt.

This is not just a style complaint. It makes the runtime harder to test,
harder to evolve, and more likely to grow hidden coupling between
backlog, cycle, signpost, and execution behavior. It also raises the
cost of exposing a cleaner library or MCP surface because too many
operations hide behind one mutable object.

Follow-on decomposition should extract focused modules for backlog
operations, cycle operations, witness/command execution, and status/
signpost generation while preserving the honest public API.
