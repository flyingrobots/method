---
title: "Invariant: Signpost Boundedness"
---

## What must remain true?

Signposts live at root or one level into `docs/`. They summarize
state; they never create commitments.

## Why does it matter?

If signposts nest deeper, they stop being discoverable at a glance.
If they create commitments, they compete with design docs and backlog
items for authority. A signpost that promises something is a
commitment hiding in the wrong place — it will drift from the real
decisions and nobody will notice until the contradiction bites.

## How do you check?

- `README.md` is the only root-level signpost. All others use
  `ALL_CAPS.md` and live in `docs/` (not nested deeper).
- No `ALL_CAPS.md` file exists in any subdirectory deeper than one
  level under `docs/` (e.g., `docs/*/*`).
- Signpost content uses language like "summarizes" and "reflects,"
  not "we will" or "we commit to."
