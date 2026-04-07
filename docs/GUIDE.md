---
title: "Guide"
generator: "method sync ship"
provenance_level: artifact_history
---

# Guide

This document holds practical advice for working in a METHOD repo. It
is intentionally lighter than doctrine in `README.md` or
`docs/method/process.md`.

If a practice proves durable and load-bearing, it can graduate into the
core method later. Until then, this is guidance: useful, explicit, and
non-binding.

## Capture ideas immediately

If a backlog-worthy idea surfaces during the work, capture it now.

Do not leave it only in chat. Do not leave it floating uncommitted in a
dirty worktree. Do not assume you will remember it after the current
task is done.

Prefer a small standalone docs commit that:

- creates the backlog note
- keeps it separate from feature/code changes
- preserves the moment it became real enough to name

Why this is good practice:

- It is honest.
- It preserves provenance in Git.
- It reduces the chance of losing the idea or confusing it with the
  current feature work.
- It avoids awkward cleanup and weird Git operations later.

## Advice is not doctrine

Some things are worth saying before they are worth standardizing.

`README.md` and `docs/method/process.md` describe the load-bearing
contract of METHOD. This guide is for patterns that help in practice
but are not yet strong enough to claim as universal rules.

## Signposts

<!-- generate:signpost-inventory -->
| Signpost | Type | Description |
|----------|------|-------------|
| `README.md` | Hand-authored | Core doctrine and filesystem shape. |
| `ARCHITECTURE.md` | Hybrid | How the source code is organized. |
| `docs/BEARING.md` | Generated | Current direction and recent ships. |
| `docs/VISION.md` | Generated | Bounded executive synthesis. |
| `docs/CLI.md` | Hybrid | CLI command reference. |
| `docs/MCP.md` | Hybrid | MCP tool reference. |
| `docs/GUIDE.md` | Hybrid | Operator advice with generated sections. |
<!-- /generate -->
