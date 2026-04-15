---
title: "Generated Reference Signposts"
outcome: hill-met
drift_check: yes
---

# Generated Reference Signposts Retro

Design: `docs/design/0027-generated-reference-signposts/generated-reference-signposts.md`
Outcome: hill-met
Drift check: yes

## Summary

CLI.md and MCP.md are now generated from source code during
`method sync ship`. CLI reference is built from the `usage()` function
and `CLI_TOPICS` constant. MCP reference is built from the `MCP_TOOLS`
array. Both carry `generated_from_commit` SHA in frontmatter. These
docs can never drift from the implementation.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- `captureIdea` does not write YAML frontmatter on new inbox items.

## Cool Ideas

- Generate ARCHITECTURE.md sections from source file structure.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
