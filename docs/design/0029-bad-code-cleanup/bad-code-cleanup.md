---
title: "Bad Code Cleanup"
legend: PROCESS
---

# Bad Code Cleanup

Source: pre-release audit findings (bad-code lane).
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Code Hardener

## Hill

Clear the bad-code lane by fixing all four remaining items:
depth-limit directory walks, replace manual YAML parsing with a
library, validate GitHub API responses with Zod, and decompose
the Workspace god class.

## Playback Questions

### Human

- [ ] Directory walks have depth limits and skip symlinks.
- [ ] Frontmatter parsing uses a YAML library, not string slicing.
- [ ] GitHub API responses are validated before use.
- [ ] The Workspace class delegates to focused modules.

### Agent

- [ ] collectMarkdownFiles and collectFiles have maxDepth and symlink
  guards.
- [ ] A yaml library parses and serializes frontmatter.
- [ ] Zod schemas validate GitHub API issue and comment responses.
- [ ] src/index.ts Workspace class is under 400 lines after extraction.
- [ ] All 127+ tests still pass.

## Accessibility and Assistive Reading

Not in scope. Internal refactor.

## Localization and Directionality

Not in scope.

## Agent Inspectability and Explainability

Not in scope. Internal refactor.

## Non-goals

- [ ] Changing the public API surface.
- [ ] Adding new features.
- [ ] Changing test behavior.
