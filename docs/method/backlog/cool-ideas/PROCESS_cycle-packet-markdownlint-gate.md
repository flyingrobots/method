---
title: "Cycle Packet Markdownlint Gate"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The lint scope is explicitly limited to cycle packet markdown under docs/design/[0-9][0-9][0-9][0-9]-*/**/*.md and docs/method/retro/[0-9][0-9][0-9][0-9]-*/**/*.md."
  - "The gate enforces markdownlint rules MD040 and MD031 plus cycle-packet frontmatter key checks."
  - "The chosen entrypoint exits 0 on clean packets and non-zero with file/rule-localized failures when any packet violates the contract."
---

# Cycle Packet Markdownlint Gate

This review round caught witness and retro packet issues that a small
markdown lint pass could have surfaced before PR review: unlabeled code
fences, empty placeholder blocks, and wording drift inside committed
artifacts.

Idea: add a bounded markdown validation step for cycle packets and other
generated repo artifacts so contract-level doc issues fail fast instead
of landing as manual review cleanup.

## Proposed Contract

- Scope globs:
  `docs/design/[0-9][0-9][0-9][0-9]-*/**/*.md` and
  `docs/method/retro/[0-9][0-9][0-9][0-9]-*/**/*.md`.
- Rules:
  `MD040` (fenced code blocks need a language),
  `MD031` (fenced code blocks need surrounding blank lines), and custom
  packet checks for required frontmatter keys on generated docs.
- Frontmatter checks:
  design docs require `title`, `legend`, `cycle`, and `source_backlog`;
  retro docs require `title`, `cycle`, `design_doc`, `outcome`, and
  `drift_check`.
- Integration point:
  a dedicated `method validate markdown` entrypoint that can be invoked
  locally, from pre-commit, and from a CI job such as
  `markdown-contract`.
- Pass / fail behavior:
  exit `0` when all scoped files satisfy the bounded rule set; exit
  non-zero when any scoped file violates one of the named rules or
  frontmatter checks, with output that names the file and failing rule.

## Non-goals

- [ ] Lint every markdown file in the repository.
- [ ] Replace broader review judgment on cycle quality with style-only
      checks.
