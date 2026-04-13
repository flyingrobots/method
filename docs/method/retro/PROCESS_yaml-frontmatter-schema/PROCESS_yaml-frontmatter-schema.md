---
title: "YAML frontmatter schema for METHOD documents"
outcome: hill-met
drift_check: yes
---

Design: `docs/design/0010-yaml-frontmatter-schema/yaml-frontmatter-schema.md`

## Summary

This cycle established a unified frontmatter strategy across all METHOD
document classes. Design docs now carry `legend`, retros carry
`outcome` and `drift_check`, and signposts like `VISION` and `BEARING`
carry provenance-oriented metadata. Automated enforcement in
`docs.test.ts` ensures that new documents stay compliant.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- [ ] Automate frontmatter generation in `method pull` and `method close`.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
