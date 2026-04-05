---
title: "YAML frontmatter schema for METHOD documents"
legend: PROCESS
---

Source backlog item: `docs/method/backlog/inbox/PROCESS_yaml-frontmatter-schema.md`


## Sponsors

- Human: Backlog Operator
- Agent: Sync Automator

## Hill

Define and enforce a unified YAML frontmatter strategy across all METHOD
document classes (signposts, design docs, retros, legends, backlog). The
goal is to provide a consistent metadata layer for both humans and
agents without creating undue noise for hand-authored notes.

## Playback Questions

### Human

- [ ] All document classes in the repo have been reviewed for frontmatter
  suitability.
- [ ] Signposts and release artifacts carry the mandatory "trusted"
  provenance fields (`generated_at`, `generator`, `source_files`).
- [ ] Hand-authored design and retro docs carry minimal, useful
  metadata (e.g., `legend`, `status`, `sponsors`) without bloat.

### Agent

- [ ] `docs.test.ts` validates that all markdown files in `docs/`
  (except specifically excluded ones like `BEARING.md` or `README.md`)
  contain a valid YAML frontmatter block.
- [ ] `docs.test.ts` enforces mandatory fields per document type (e.g.,
  `design` docs must have `legend`, `retros` must have `outcome`).
- [ ] `docs.test.ts` ensures no "illegal" keys are used (detecting typos
  like `source-files` vs `source_files`).

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Standardized keys ensure
  consistent reading for screen readers and assistive tools.
- Non-visual or alternate-reading expectations: Frontmatter provides a
  predictable "table of contents" for the document's metadata.

## Localization and Directionality

- Locale / wording / formatting assumptions: Field names use `snake_case`
  and ISO 8601 for timestamps.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: Metadata keys
  must be deterministic so agents can query the repo via `grep` or
  scripted parsing.
- What must be attributable, evidenced, or governed: Provenance fields
  in signposts and releases are governed by the contract established in
  cycle 0009.

## Non-goals

- [ ] Implementing a formal JSON-schema validator (regex and basic
  parsing in Vitest is enough for now).
- [ ] Automating the *updates* to existing docs (this cycle is about
  the schema and enforcement).

## Backlog Context

METHOD increasingly uses YAML frontmatter for generated signposts and
release-oriented artifacts, but the repo does not yet define a coherent
schema strategy across document types. We need a repo-level decision
about when frontmatter is required, what keys are shared, what keys are
document-specific, and how strict the validation should be.

## Standard Schema Definition

### Shared Base (Optional for all)
- `title`: string
- `generated_at`: ISO 8601 string
- `legend`: string (uppercase)
- `cycle`: string (e.g., "0010")

### Signpost / Generated Docs (Mandatory)
- `generated_at`: ISO 8601 string
- `generator`: string
- `generated_from_commit`: string (40-char SHA)
- `provenance_level`: string
- `witness_ref`: string (path)
- `source_files`: array of strings

### Design Docs (Recommended)
- `sponsors`: object (`human`, `agent`)
- `source_backlog`: string (path)

### Retros (Recommended)
- `design_doc`: string (path)
- `outcome`: enum (`hill-met`, `pivot`, `abandoned`)
- `drift_check`: boolean

### Backlog Items (Minimal)
- `legend`: string
- `lane`: string
