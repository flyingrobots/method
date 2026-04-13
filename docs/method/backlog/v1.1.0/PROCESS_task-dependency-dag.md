---
title: "Task Dependency DAG"
legend: PROCESS
lane: v1.1.0
owner: "METHOD maintainers"
priority: medium
---

# Add blocks/blocked_by fields to task YAML frontmatter

## What

Extend METHOD task file conventions to support dependency tracking:

- `blocks:` — list of task IDs this item blocks
- `blocked_by:` — list of task IDs this item is blocked by

Add MCP/CLI methods to:
- Generate the full dependency DAG from frontmatter
- Show the DAG for a specific task (what blocks it, what it blocks)
- Show unblocked items (layer 0 — ready to start)
- Show the critical path to a given item

## Why

Used this pattern in git-warp v17.0.0 backlog planning. The YAML
frontmatter + critical path visualization made the execution order
obvious. Without it, items reference each other in prose and the
dependency order is invisible.

## Origin

git-warp cycle 0013. 21 backlog items with dependency DAG in
`docs/method/backlog/v17.0.0/`.
