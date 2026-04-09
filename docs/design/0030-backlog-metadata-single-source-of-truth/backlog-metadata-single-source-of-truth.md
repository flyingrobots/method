---
title: "Backlog Metadata Single Source Of Truth"
legend: PROCESS
cycle: "0030-backlog-metadata-single-source-of-truth"
source_backlog: "docs/method/backlog/asap/PROCESS_backlog-metadata-single-source-of-truth.md"
---

# Backlog Metadata Single Source Of Truth

Source backlog item: `docs/method/backlog/asap/PROCESS_backlog-metadata-single-source-of-truth.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator who needs lane and legend moves to stay honest
  without manually repairing YAML after every triage action.
- Agent: Automation and MCP clients that need one cheap, stable source of
  backlog truth instead of inferring metadata from filenames and
  directory shape.

## Hill

Backlog metadata becomes frontmatter-first. `status`, `pull`, lane
moves, and legend health all resolve `legend` and `lane` from YAML when
present, while compatibility fallbacks keep older cards readable until
they are backfilled. Managed moves should repair missing lane metadata
instead of preserving drift.

## Playback Questions

### Human

- [ ] If a backlog card's filename or directory disagrees with its YAML,
      does `method status` report the YAML lane and legend rather than
      the path-derived guess?
- [ ] If I move a legacy backlog card between lanes, does METHOD
      backfill lane metadata so the card no longer depends on path
      inference?

### Agent

- [ ] Can I consume backlog lane and legend from `Workspace.status()`
      without reverse-engineering filename prefixes or folder names?
- [ ] If a backlog card has stale filename legend text, does `method pull`
      still carry the YAML legend into the design packet?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: backlog metadata should be
  explicit in one place so humans and agents do not need to cross-check
  path, filename, and YAML to learn the current state.
- Non-visual or alternate-reading expectations: metadata must stay
  machine-readable and linearly inspectable from the document header.

## Localization and Directionality

- Locale / wording / formatting assumptions: legend codes remain stable,
  uppercase repo-local identifiers independent of prose wording.
- Logical direction / layout assumptions: no layout dependence; the
  solution lives in YAML keys and deterministic CLI/API output.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: lane and legend
  resolution order, compatibility fallback behavior, and move-time
  metadata repair.
- What must be attributable, evidenced, or governed: tests should prove
  that frontmatter wins over filenames and directories, and that active
  legend health can read design doc frontmatter.

## Non-goals

- [ ] Redesign backlog filenames or cycle slug generation in this cycle.
- [ ] Eliminate every legacy fallback path before the repo backlog docs
      have been backfilled.
- [ ] Replace the generated design or retro scaffolds; that remains
      separate debt under `PROCESS_generated-doc-scaffold-contract`.

## Backlog Context

Backlog metadata is still split across filename prefixes and YAML
frontmatter. `captureIdea` writes `legend` and `lane` into frontmatter,
but `collectBacklogItems`, `calculateLegendHealth`, and `pullItem` still
derive legend from the filename stem, while `moveBacklogItem` renames the
file without updating frontmatter metadata. That creates silent drift:
the path can say one thing, the YAML can say another, and status/MCP
surfaces may report whichever source they happen to trust.

This is bad code because the repo now has multiple authorities for the
same facts. It is especially hostile to agents, which need one cheap,
stable, machine-readable source instead of filename heuristics plus
special-case inference.

The fix should make frontmatter canonical for backlog metadata, keep
filenames as convenience or display structure, and ensure move/pull/
status/audit flows preserve and validate the YAML fields.
