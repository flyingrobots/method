---
title: "Typed Frontmatter Access"
legend: "PROCESS"
cycle: "PROCESS_typed-frontmatter-access"
source_backlog: "docs/method/backlog/bad-code/PROCESS_typed-frontmatter-access.md"
---

# Typed Frontmatter Access

Source backlog item: `docs/method/backlog/bad-code/PROCESS_typed-frontmatter-access.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

The typed frontmatter surface preserves YAML-native types on read and
rejects type downgrades on write, so structured fields like arrays and
booleans survive round-trips without collapsing to strings.

## Playback Questions

### Human

- [ ] Does `readTypedFrontmatter` preserve arrays, booleans, and numbers instead of collapsing them to strings?

### Agent

- [ ] Does `updateTypedFrontmatter` reject type downgrades from array to string?
- [ ] Does `updateTypedFrontmatter` reject type downgrades from boolean to string?
- [ ] Does `updateTypedFrontmatter` allow same-type updates without error?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: error messages name the
  field, expected type, and attempted type.
- Non-visual or alternate-reading expectations: not in scope (API).

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: downgrade errors
  are thrown with a structured message pattern so agents can detect
  the field and types programmatically.
- What must be attributable, evidenced, or governed: the typed read
  surface returns YAML-native values; agents do not need to re-parse.

## Non-goals

- [ ] Support every YAML feature (maps, anchors, tags).
- [ ] Migrate all existing callers from `readFrontmatter` to `readTypedFrontmatter`.
- [ ] Schema-level validation beyond type-shape matching.
