---
title: "Hybrid Signpost Generation"
outcome: hill-met
drift_check: yes
---

# Hybrid Signpost Generation Retro

Design: `docs/design/0028-hybrid-signpost-generation/hybrid-signpost-generation.md`
Outcome: hill-met
Drift check: yes

## Summary

Replaced fully-generated signposts with a hybrid model using
`<!-- generate:NAME -->` / `<!-- /generate -->` markers. Hand-authored
prose survives regeneration. Ship sync replaces only the content
between markers. Three generators implemented: cli-commands,
mcp-tools, signpost-inventory.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- `captureIdea` still does not write YAML frontmatter on new inbox items.

## Cool Ideas

- Add a `generate:backlog-summary` section for GUIDE.md.
- Add marker support to ARCHITECTURE.md for auto-generated source listing.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
