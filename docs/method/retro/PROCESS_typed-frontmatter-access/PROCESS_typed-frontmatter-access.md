---
title: "Typed Frontmatter Access"
cycle: "PROCESS_typed-frontmatter-access"
design_doc: "docs/design/PROCESS_typed-frontmatter-access.md"
outcome: hill-met
drift_check: yes
---

# Typed Frontmatter Access Retro

## Summary

The typed read surface (`readTypedFrontmatter`) already preserved
YAML-native types. Added type-downgrade protection to
`updateTypedFrontmatter`: writes that would change a field's type shape
(e.g. array to string, boolean to string) now throw with a message
naming the field and the type mismatch. Legacy `updateFrontmatter`
callers (GitHub adapter) are unaffected since they only write string
fields.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_typed-frontmatter-access/witness` and link them here.

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [ ] Inbox processed
- [ ] Priorities reviewed
- [ ] Dead work buried or merged
