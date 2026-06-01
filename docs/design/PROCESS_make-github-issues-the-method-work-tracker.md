---
title: "Make GitHub Issues The Method Work Tracker"
legend: PROCESS
cycle: "PROCESS_make-github-issues-the-method-work-tracker"
branch: "make-github-issues-the-method-work-tracker"
---

# Make GitHub Issues The Method Work Tracker

Source issue: https://github.com/flyingrobots/method/issues/27
Legend: PROCESS

## Sponsors

- Human: OSS contributor and Method maintainer
- Agent: Workflow automation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or model
brand.

## Hill

As an OSS contributor and agent collaborator, I can discover, start,
track, and close Method work through GitHub Issues while Method design
docs, witnesses, playbacks, and retros remain durable repo evidence.

## Playback Questions

### Human

- [ ] Does a new contributor see GitHub Issues as the canonical place to
      find and propose work?
- [ ] Does the repo still explain that design docs, witnesses, playbacks,
      retros, and release evidence remain Method artifacts?
- [ ] Does active work have a predictable branch name derived from the
      issue title?

### Agent

- [ ] Are Method lane, legend, priority, type, and active-work states
      represented as explicit GitHub labels?
- [ ] Do issue and PR templates encode the Method evidence contract?
- [ ] Do docs classify existing filesystem backlog commands as legacy or
      migration surfaces rather than the new authority model?

## Design

### Decision 1: GitHub Issues are the live tracker

Method work is tracked in repo-local GitHub Issues. Lanes are labels.
Release scope is a milestone plus `lane:release`. Active work carries
`work-in-progress`.

### Decision 2: Repo files are the evidence ledger

Design docs, tests, playback witnesses, retrospectives, release notes,
and generated signposts remain in the repository. They are evidence,
not the live tracker.

### Decision 3: Branches follow issue title slugs

Active work branches use a normalized slug derived from the issue title.
This makes issue names part of workflow identity, so titles should be
short, sane, branch-safe, and contributor-readable.

### Decision 4: Filesystem backlog becomes legacy/migration surface

Existing backlog files are not deleted in this cycle. They remain as
migration input until a migration command or manual migration pass
creates corresponding GitHub Issues and archives/stubs the old files.

## Migration Plan

### Method pilot

1. Create the canonical label set in `flyingrobots/method`.
2. Add GitHub issue templates and a PR template.
3. Update doctrine so GitHub Issues are the live tracker and repo files
   are the evidence ledger.
4. Migrate live Method backlog cards into GitHub Issues with source-file
   provenance in the issue body using
   `scripts/migrate-backlog-to-github-issues.mjs` or `npm run migrate`.
5. Archive or stub migrated backlog cards so they stop acting as a
   second live tracker.
6. Leave historical graveyard files read-only until a separate cleanup
   decision says whether to archive or import them.

### Echo follow-up

1. Query existing Echo issues before creating anything.
2. Match backlog cards to existing issues by title, source path, and
   concept.
3. Update matching issues with Method lane labels and source-file
   provenance.
4. Create new issues only for live cards with no existing issue.
5. Transfer work to another repo when the card belongs elsewhere.
6. Archive/stub migrated Echo backlog cards only after the issue mapping
   is inspectable.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: GitHub Issues provide the
  live list of work; repo docs provide durable evidence. Users should
  not need to reconcile two active trackers.
- Non-visual or alternate-reading expectations: issue templates use
  plain markdown fields and checklist criteria.

## Localization and Directionality

- Locale / wording / formatting assumptions: issue labels use stable
  ASCII identifiers independent of prose.
- Logical direction / layout assumptions: no layout-dependent meaning.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: lane labels,
  `work-in-progress`, source issue links, and branch slugs.
- What must be attributable, evidenced, or governed: every Method cycle
  should link the GitHub issue, PR, design doc, witness, and retro.

## Non-goals

- [ ] Bulk migrate Echo backlog items.
- [ ] Replace every filesystem-backlog CLI command in this cycle.
- [ ] Delete historical graveyard files before a migration policy exists.
- [ ] Add GitHub Projects.

## Acceptance Criteria

- [ ] GitHub labels for the Method issue taxonomy exist in
      `flyingrobots/method`.
- [ ] GitHub issue templates exist for work items, bugs, and spikes.
- [ ] A PR template links GitHub issue tracking to Method evidence.
- [ ] README and PROCESS state that GitHub Issues are the live tracker.
- [ ] CONTRIBUTING starts from GitHub Issues, not local backlog files.
- [ ] Branch naming doctrine uses issue-title slugs.
- [ ] Existing filesystem-backlog GitHub sync behavior is documented as
      migration/legacy behavior.
- [ ] The current Method backlog migration path is documented before
      Echo migration starts.
