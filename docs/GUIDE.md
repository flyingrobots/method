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

For the METHOD repo itself, "non-binding" is not permission to drift.
If this guide repeatedly governs real work in this repository, the repo
should either follow it honestly, promote it into doctrine, or retire
it. The METHOD repo does not get a carve-out from its own operating
notes.

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

## Process feedback in batches

If review notes or operator feedback start piling up, capture them in
`docs/method/feedback/` instead of scattering them across chat or
deleting them after triage.

Treat a feedback doc as raw input, not as a backlog item yet. During a
maintenance pass, read it carefully, split accepted points into the
right durable artifacts, and then move the source document into
`docs/method/feedback/archive/` with a short note about what happened.

Why this is good practice:

- It keeps the backlog from becoming a dumping ground for half-processed
  critique.
- It preserves the original wording and context behind later backlog or
  docs changes.
- It makes "no action" a visible decision instead of silent deletion.

## Advice is not doctrine

Some things are worth saying before they are worth standardizing.

`README.md` and `docs/method/process.md` describe the load-bearing
contract of METHOD. This guide is for patterns that help in practice
but are not yet strong enough to claim as universal rules.

That distinction still requires honesty. For the METHOD repo, guidance
must not become a shadow process that we invoke when useful and ignore
when inconvenient. If a guide note is doing real governance work, say so
more strongly or stop pretending it matters.

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
