---
title: "Doctor Command"
cycle: "0038-doctor-command"
design_doc: "docs/design/0038-doctor-command/doctor-command.md"
outcome: hill-met
drift_check: yes
---

# Doctor Command Retro

## Summary

This cycle landed a native `doctor` surface for METHOD that works even
when the workspace cannot be loaded through the normal `Workspace`
constructor path. The new engine inspects configuration parsing,
required repo structure, packet frontmatter, git hook setup, and
backlog lane shape, then reports bounded issues with direct fix
suggestions for both humans and agents.

The late cleanup in this cycle mattered. The first pass treated missing
empty backlog lane directories as hard structural failures and treated
an unset `core.hooksPath` as "git metadata unavailable." The final
behavior is stricter in the right places instead: missing empty lane
directories in a clean clone are acceptable, while a real repo with no
configured hooks reports a truthful warning instead of a false error.

## Playback Witness

- [Verification Witness](./witness/verification.md)
- Close-time verification captured the full `npm test` pass and a direct
  drift check for `0038-doctor-command`.

## Drift

- None recorded after aligning the final agent playback question string
  to its exact test description.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- Backlog maintenance deferred; the cycle hill was about bounded
  diagnosis, not repo-wide triage or queue grooming.
- [ ] Inbox processed
- [x] Priorities reviewed
- [ ] Dead work buried or merged
