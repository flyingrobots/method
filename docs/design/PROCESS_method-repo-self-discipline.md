---
title: "METHOD Repo Self Discipline"
legend: "PROCESS"
cycle: "PROCESS_method-repo-self-discipline"
source_backlog: "docs/method/backlog/inbox/PROCESS_method-repo-self-discipline.md"
---

# METHOD Repo Self Discipline

Source backlog item: `docs/method/backlog/inbox/PROCESS_method-repo-self-discipline.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

The METHOD repo stops making special pleading for itself. Repo doctrine
and release guidance explicitly treat "open cycle packet on `main`" as a
stop-and-repair defect, local tool junk is kept out of version control,
and legacy docs no longer need a tracked one-off script just to recover
missing `title` frontmatter.

## Playback Questions

### Human

- [ ] Does METHOD repo doctrine now say that `main` should not carry open cycle packets or release-prep exceptions, and that discovering one is stop-and-repair work?
- [ ] If I prep a release from this repo, does the release runbook explicitly fail when active cycles are still open on `main`?

### Agent

- [ ] Do repo tests lock the self-discipline rule so README/process/release docs and local tool ignore posture cannot silently drift again?
- [ ] When legacy docs are missing `title` frontmatter, can METHOD still read them without needing a tracked ad hoc repair script?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture:
  the doctrine and runbook updates must use direct stop/go language so a
  human scanning the repo can tell immediately that open packets on
  `main` are defects, not acceptable background noise.
- Non-visual or alternate-reading expectations:
  the resulting tests should cite the exact repo surfaces and filenames
  they protect so agents and screen-reader users can trace the rule
  without visual diff hunting.

## Localization and Directionality

- Locale / wording / formatting assumptions:
  English-only repo doctrine is acceptable here; the key is explicit
  semantics, not translated phrasing.
- Logical direction / layout assumptions:
  plain Markdown and filesystem paths only; no layout-specific cues.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents:
  which files define the self-discipline rule, which local tool files
  are ignored, and what legacy frontmatter repair is intentionally
  supported on read.
- What must be attributable, evidenced, or governed:
  the cleanup must be backed by repo tests and committed docs, not by a
  hand-wavy promise that maintainers will "remember to be better."

## Non-goals

- [ ] Build a full release automation command in this cycle.
- [ ] Auto-rewrite every legacy METHOD document into the modern
      frontmatter schema.
- [ ] Treat branch-local convenience files as publishable or reviewable
      repo artifacts.

## Backlog Context

METHOD repo should not ship open cycle packets, tracked local tool junk, or release-prep ambiguity while claiming METHOD discipline. Add explicit repo-self-discipline guidance and tests so the method repo follows its own method without special pleading.
