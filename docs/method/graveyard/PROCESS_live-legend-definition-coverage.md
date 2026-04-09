---
title: "Live Legend Definition Coverage"
legend: PROCESS
lane: graveyard
---

# Live Legend Definition Coverage

## Disposition

Retired on 2026-04-09 because the premise is no longer true in the live
repo. This note claimed that `MCP` was already being used as a live
legend in backlog work while `docs/method/legends/` only defined
`PROCESS` and `SYNTH`.

That is not current repo truth anymore. The live backlog, design docs,
and retros now use `PROCESS`, `SYNTH`, or `none`, and the only remaining
`legend: MCP` document is already a historical graveyard entry. There is
no active undocumented legend to cover, so keeping this note in
`up-next/` would create fake urgency around a stale premise.

If the repo later starts using another live legend without a matching
legend doc, reintroduce that as a fresh backlog item with scope grounded
in the current files instead of resurrecting this tombstone by default.

## Original Proposal

The backlog was already using `MCP` as a live legend, but
`docs/method/legends/` still only defined `PROCESS` and `SYNTH`. Tests
and signposts treated legend docs as the discovered taxonomy, which
meant the repo could have real legend-bearing work that was not
documented as a first-class legend.

The proposed fix was to close that taxonomy drift by either adding a
legend doc for the live legend or stopping use of that legend.
