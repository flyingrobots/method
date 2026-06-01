---
title: "Reserve graveyard and enforce disposition-bearing retirement"
legend: PROCESS
lane: bad-code
priority: high
source: "docs/audits/004-graveyard-lifecycle-semantics-audit.md"
acceptance_criteria:
  - "Completed work is documented as retro/witness, not graveyard"
  - "`graveyard` is rejected as a live backlog lane"
  - "`method backlog add --lane graveyard` fails with guidance to use `method retire`"
  - "`method backlog move --to graveyard` fails with guidance to use `method retire`"
  - "`method_retire` is the only public path that moves live backlog items into graveyard"
  - "Graveyard docs distinguish superseded/retired proposals from completed cycles"
---

# Reserve graveyard and enforce disposition-bearing retirement

Source: `docs/audits/004-graveyard-lifecycle-semantics-audit.md`

METHOD currently lets `graveyard` act like a live backlog lane in some
surfaces, while docs also say graveyard entries can include work
"completed indirectly by a broader cycle." This blurs completion and
retirement and can train agents to move completed cards into graveyard.

Fix the docs and tool validation so completed work is represented by a
closed cycle packet, while graveyard movement is reserved for explicit
retirement with a disposition tombstone.

## Problem

- `docs/method/graveyard/README.md` says a backlog item can enter the
  graveyard when it was completed indirectly by a broader cycle.
- `graveyard` is accepted by lane normalization as a live backlog lane.
- `method backlog move --to graveyard`, MCP `method_backlog_move`, and
  GitHub closed-issue sync can move backlog items without the
  disposition contract enforced by `method retire`.

## Desired Outcome

- Completed cycle work is never moved to graveyard just because it is
  done. The completion artifact is the retro and witness packet.
- Graveyard is reserved for retired, canceled, superseded, or
  no-longer-live proposals.
- Public graveyard moves require an explicit reason and preserve the
  original proposal under a tombstone.
