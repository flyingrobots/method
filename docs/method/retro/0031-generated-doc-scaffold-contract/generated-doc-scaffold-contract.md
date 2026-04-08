---
title: "Generated Doc Scaffold Contract"
cycle: "0031-generated-doc-scaffold-contract"
design_doc: "docs/design/0031-generated-doc-scaffold-contract/generated-doc-scaffold-contract.md"
outcome: hill-met
drift_check: yes
---

# Generated Doc Scaffold Contract Retro

Design: `docs/design/0031-generated-doc-scaffold-contract/generated-doc-scaffold-contract.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle brought METHOD's generated design and retro scaffolds back
into parity with the repo's committed document contract. `method pull`
now emits design docs with the required frontmatter and non-TBD sponsor
roles, `method close` emits retro docs with commit-safe frontmatter,
close-time witness output now sanitizes personal absolute paths, and the
CLI tests now lock those scaffold guarantees in place. The already
generated `0030` retro and `0031` design packet were repaired on-branch
so the repo no longer depends on manual cleanup after generation.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
