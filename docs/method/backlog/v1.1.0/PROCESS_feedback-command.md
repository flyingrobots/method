---
title: "Feedback Command"
legend: PROCESS
lane: v1.1.0
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines a bounded CLI and MCP surface for capturing raw feedback into docs/method/feedback/."
  - "The contract also covers archiving processed feedback with a short disposition note instead of silent deletion."
  - "The result shape preserves feedback identity fields such as path, title, source, captured_at, and status."
  - "The design keeps feedback distinct from backlog items so critique remains source material until processed."
---

# Feedback Command

METHOD already has a documented `docs/method/feedback/` workflow, but no
native mutation surface for it. That is a repo concept without a
matching agent surface.

The gap shows up whenever humans or agents want to capture critique,
review notes, or rough observations without prematurely turning them
into backlog work.

## Proposed Contract

- Capture surface:
  ship a CLI command such as
  `method feedback add --title <title> [--source <text>] [--body-file <path>] [--captured-at <date>] [--json]`
  plus an MCP tool such as `method_feedback_add`.
- Archive surface:
  add a companion command such as
  `method feedback archive <item> --disposition-file <path> [--json]`
  plus an MCP equivalent, so processed feedback can move into
  `docs/method/feedback/archive/` with an explicit disposition note.
- Result shape:
  return at least `path`, `title`, `source`, `captured_at`, `status`,
  and any `archived_path` when archival happens.
- Boundary:
  feedback remains source material. The command should not auto-create
  backlog notes or cycles just because feedback was captured.

## Why It Matters

- Feedback is currently a documented part of METHOD without first-class
  write support.
- A native archive flow would make provenance cheaper to preserve and
  reduce pressure to leave processed feedback mixed into the live inbox.
- Agents need a named place to put critique before a human or later pass
  decides what should land.

## Non-goals

- Auto-triage feedback directly into backlog items.
- Replace the backlog as the home of accepted planned work.
- Build a generalized comments or review system inside METHOD.
