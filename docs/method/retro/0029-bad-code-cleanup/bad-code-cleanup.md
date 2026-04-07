---
title: "Bad Code Cleanup"
outcome: hill-met
drift_check: yes
---

# Bad Code Cleanup Retro

Design: `docs/design/0029-bad-code-cleanup/bad-code-cleanup.md`
Outcome: hill-met
Drift check: yes

## Summary

Cleared the bad-code lane. Four fixes:

1. **Depth limits**: collectMarkdownFiles and collectFiles now have
   maxDepth=10 and skip symlinks.
2. **YAML library**: New src/frontmatter.ts uses the `yaml` package.
   All manual string-slicing YAML parsing removed.
3. **GitHub API validation**: Zod schemas validate issue and comment
   responses. No more `any` casts.
4. **God class decomposition**: Extracted src/renderers.ts (188 lines)
   and src/frontmatter.ts (100 lines). Workspace reduced from 854 to
   604 lines (30% reduction).

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- Workspace is still 604 lines. Further decomposition (backlog ops,
  cycle ops) would require changing the public API.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
