---
title: "Invariant: Cycle Traceability"
---

## What must remain true?

Every cycle is discoverable and ends with a retro, regardless of
outcome.

## Why does it matter?

If a cycle can ship or fail without leaving a trace, the repo stops
being the single source of truth. Silent outcomes erode trust in the
filesystem as a coordination layer. A failed cycle with no retro
teaches nothing; a successful one with no witness proves nothing.

## How do you check?

- `ls docs/method/retro/` lists every completed cycle.
- Every retro directory contains a witness.
- `method status` shows all active cycles.
- No cycle directory exists in `docs/design/` without a corresponding
  entry discoverable via the repo.
