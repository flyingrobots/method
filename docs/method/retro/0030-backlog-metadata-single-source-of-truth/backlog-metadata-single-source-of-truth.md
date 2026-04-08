---
title: "Backlog Metadata Single Source Of Truth"
cycle: "0030-backlog-metadata-single-source-of-truth"
design_doc: "docs/design/0030-backlog-metadata-single-source-of-truth/backlog-metadata-single-source-of-truth.md"
outcome: hill-met
drift_check: yes
---

# Backlog Metadata Single Source Of Truth Retro

Design: `docs/design/0030-backlog-metadata-single-source-of-truth/backlog-metadata-single-source-of-truth.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle made backlog metadata frontmatter-first across the live
workspace surfaces. `status`, `pull`, lane moves, and legend health now
prefer YAML metadata, managed moves repair missing lane metadata, and
the repo backlog was backfilled so the remaining cards stop depending on
directory-only truth.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- `method close` generated this retro without the required frontmatter,
  which directly triggered follow-on cycle `0031-generated-doc-scaffold-contract`.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
