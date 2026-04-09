---
title: "Design Doc Template Catalog"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines a bounded catalog of at least four design-doc templates instead of a single universal scaffold."
  - "Each template states when it should be used plus the sections or prompts it must contain."
  - "The proposal preserves the current shared core sections and separates them from template-specific additions."
  - "The note explains how `method pull` or a future scaffolder could select a template without requiring implementation in the same slice."
---

# Design Doc Template Catalog

METHOD's current design docs share a strong baseline scaffold, but the
same outline is not equally informative for every slice. A feature
delivery cycle, a contract-surface change, a cleanup refactor, a
docs-policy change, and an exploratory spike do not all need the same
questions emphasized in the same order.

That mismatch produces placeholder sections, strained prose, and design
docs that technically satisfy the scaffold while still being weaker than
they should be. A small template catalog would make the initial design
doc shape fit the work instead of forcing every slice through one
universal outline.

## Proposed Contract

- Enforcement level:
  each template's "Must contain" list defines scaffold prompts and
  review expectations, not an immediate hard validator. A design doc
  using `contract-surface` or another template SHOULD address those
  topics, but authors may merge or omit headings when reviewers accept
  the rationale. A later validation slice may choose to turn those
  prompts into explicit heading checks once template metadata is stable.
- Shared core across all templates:
  all templates keep the current frontmatter contract
  (`title`, `legend`, `cycle`, `source_backlog`) plus the shared
  sections `## Sponsors`, `## Hill`, `## Playback Questions`,
  `## Accessibility and Assistive Reading`,
  `## Localization and Directionality`,
  `## Agent Inspectability and Explainability`, `## Non-goals`, and
  `## Backlog Context`.
- Template identifier:
  future scaffolds may add an explicit template marker such as
  `template: default-change | contract-surface | refactor-cleanup | docs-policy | spike`.
  Historical docs do not need immediate backfill.

## Template Catalog

### `default-change`

- Use when:
  the slice introduces or changes user-visible behavior, a workflow, or
  a meaningful internal capability with shipped outcomes.
- Must contain:
  the intended behavior or contract, the main happy path, expected
  failure or edge cases, and a verification plan that proves the slice
  actually landed.
- Recommended scaffold sections:
  `## Intended Behavior`,
  `## Happy Path`,
  `## Edge Cases and Failure Modes`,
  `## Verification Plan`.
  Authors may merge or rename these sections when reviewers accept the
  rationale, but the scaffold should present them as the default
  structure.
- Optional emphasis:
  examples, sequence diagrams, rollout notes, or migration notes when
  the change is user-visible.

### `contract-surface`

- Use when:
  the slice is mainly about a bounded surface such as CLI flags, MCP
  tools, JSON shapes, exit codes, schemas, or generated reference docs.
- Must contain:
  an explicit surface inventory, required input and output shapes,
  compatibility expectations, failure modes, and concrete examples of
  the resulting contract.
- Recommended scaffold sections:
  `## Surface Inventory`,
  `## Input and Output Contract`,
  `## Compatibility Expectations`,
  `## Failure Modes`,
  `## Examples`.
- Optional emphasis:
  deprecation notes, migration windows, or parity requirements across
  multiple surfaces such as CLI and MCP.

### `refactor-cleanup`

- Use when:
  the main value is structural cleanup, extraction, decomposition, or
  removing drift without intentionally changing external behavior.
- Must contain:
  the current pain or maintenance risk, the invariants that must remain
  true after the refactor, the planned cut boundaries, and the
  regression checks that prove the cleanup did not create behavioral
  drift.
- Recommended scaffold sections:
  `## Current Pain`,
  `## Invariants`,
  `## Cut Boundaries`,
  `## Regression Checks`.
- Optional emphasis:
  before/after module maps, ownership boundaries, or dependency
  simplification notes.

### `docs-policy`

- Use when:
  the slice primarily changes README content, process rules, signposts,
  wording policy, or repo-truth coordination docs.
- Must contain:
  the affected audiences, the truth sources that must stay aligned, the
  semantic wording changes being made, and any regeneration or sync
  surfaces that must remain consistent after the edit.
- Recommended scaffold sections:
  `## Audience`,
  `## Truth Sources`,
  `## Wording Changes`,
  `## Regeneration and Sync Impact`.
- Optional emphasis:
  before/after wording examples, cross-reference tables, or explicit
  reader journeys.

### `spike`

- Use when:
  the slice is exploratory and the main output is a recommendation,
  evidence bundle, or narrowed decision rather than shipped production
  behavior.
- Must contain:
  the question being investigated, the working hypothesis, the evidence
  collection plan, the exit criteria for the spike, and the expected
  handoff into a later implementation or backlog decision.
- Recommended scaffold sections:
  `## Question`,
  `## Working Hypothesis`,
  `## Evidence Plan`,
  `## Exit Criteria`,
  `## Expected Handoff`.
- Optional emphasis:
  rejected alternatives, benchmark notes, or criteria that would cancel
  the follow-on implementation entirely.

## Selection Rules

- Default selection:
  this note does not claim that today's `renderDesignDoc()` scaffold
  already satisfies the `default-change` prompts. When template support
  lands, the no-template path must either update `renderDesignDoc()` to
  emit prompts for intended behavior or contract, main happy path,
  expected failures or edge cases, and verification plan, or introduce
  a distinct legacy template for the current scaffold instead of
  pretending it is already `default-change`.
- Explicit selection:
  a future `method pull --template <id>` or interactive scaffolder can
  choose a more specific template when the backlog item clearly fits a
  template type.
- Authoring guidance:
  the selector UX should offer short one-line descriptions for each
  template so humans and agents can pick one without reading a long
  manual during pull.

## Validation Boundary

- First step:
  template support should initially be a scaffold and authoring aid,
  not an immediate hard validator.
- Follow-on validation:
  once the catalog settles, a later slice can decide whether heading or
  frontmatter checks belong in a markdown contract gate or generated
  scaffold test.

## Non-goals

- Generate full design-doc prose automatically.
- Force every historical design doc to declare a template immediately.
- Create a large taxonomy of narrow templates that is harder to choose
  from than the current scaffold.
