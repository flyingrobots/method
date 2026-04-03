---
title: "METHOD - Executive Summary"
generated_at: 2026-04-02
generator: "manual synthesis during cycle 0004-readme-and-vision-refresh"
provenance_level: artifact_history
source_files:
  - README.md
  - CHANGELOG.md
  - docs/BEARING.md
  - docs/method/process.md
  - docs/method/release.md
  - docs/method/legends/PROCESS.md
  - docs/method/legends/SYNTH.md
  - docs/design/0001-method-cli/method-cli.md
  - docs/design/0002-playback-witness-convention/playback-witness-convention.md
  - docs/design/0002-playback-witness-convention/witness-artifacts.md
  - docs/design/0003-readme-revision/readme-revision.md
  - docs/design/0004-readme-and-vision-refresh/readme-and-vision-refresh.md
  - docs/method/retro/0001-method-cli/method-cli.md
  - docs/method/retro/0002-playback-witness-convention/playback-witness-convention.md
  - docs/method/retro/0003-readme-revision/readme-revision.md
  - docs/method/backlog/up-next/PROCESS_drift-detector.md
  - docs/method/backlog/inbox/PROCESS_behavior-spike-convention.md
  - docs/method/backlog/inbox/PROCESS_legend-audit-and-assignment.md
  - docs/method/backlog/inbox/SYNTH_artifact-history-and-semantic-provenance.md
  - docs/method/backlog/inbox/SYNTH_executive-summary-protocol.md
  - docs/method/backlog/inbox/SYNTH_generated-signpost-provenance.md
---

# METHOD - Executive Summary

## Identity

METHOD is a calm development method for a repo shared by a human and an
agent. Its core claim is simple: keep the backlog in the filesystem,
work in small cycles, prove claims with rerunnable witnesses, and close
every cycle with a retro.

The repo is intentionally light on project-management ceremony. The
filesystem is the database, `ls` is the query, and signposts explain the
state of the system without replacing the underlying files.

## Current state

METHOD is no longer only doctrine. Four cycles are already closed:

- `0001-method-cli` established a real CLI for `init`, `inbox`, `pull`,
  `close`, and `status`.
- `0002-playback-witness-convention` made reproducible witness packets a
  first-class closeout rule.
- `0003-readme-revision` rewrote the README around clearer doctrine and
  added `docs/BEARING.md`.
- `0004-readme-and-vision-refresh` made the current signpost posture
  explicit in the README and added this bounded `docs/VISION.md`
  summary.

The repo is now organized under two working legends:

- `PROCESS` for METHOD's own mechanics.
- `SYNTH` for repo self-description, signposts, and provenance shape.

There are currently no active cycles. The next likely pull remains
`PROCESS_drift-detector`.

## Signposts

METHOD currently uses three top-level signposts:

- `README.md` for doctrine and structure.
- `docs/BEARING.md` for direction and tensions at cycle boundaries.
- `docs/VISION.md` for a bounded executive synthesis.

These signposts are summaries, not commitments. Backlog items, design
docs, witnesses, and retros remain the source of truth.

## Legends

### PROCESS

`PROCESS` covers the mechanics of METHOD itself: cycle discipline,
backlog movement, drift detection, and named patterns such as behavior
spikes or pivots.

Current work in this domain:

- `PROCESS_drift-detector` is `up-next`.
- `PROCESS_behavior-spike-convention` and
  `PROCESS_legend-audit-and-assignment` are in `inbox`.

### SYNTH

`SYNTH` covers how a METHOD repo understands and explains itself:
executive summaries, generated signposts, source manifests, and the
boundary between artifact history and richer semantic provenance.

Current work in this domain:

- `SYNTH_executive-summary-protocol`,
  `SYNTH_generated-signpost-provenance`, and
  `SYNTH_artifact-history-and-semantic-provenance` are in `inbox`.

## Roadmap

### Up-next

- `PROCESS_drift-detector`
  The next concrete process cycle. It should compare design intent,
  tests, and closeout artifacts so undocumented drift is visible before
  or at close.

### Inbox

- `PROCESS_behavior-spike-convention`
  Name the pattern where a temporary implementation proves a contract or
  workflow and is later replaced cleanly.
- `PROCESS_legend-audit-and-assignment`
  Reduce the clerical work of legend coverage and orphan detection.
- `SYNTH_executive-summary-protocol`
  Turn the repo-synthesis pattern into a repeatable METHOD workflow.
- `SYNTH_generated-signpost-provenance`
  Standardize what generated signposts must say about their sources,
  generation context, and witness linkage.
- `SYNTH_artifact-history-and-semantic-provenance`
  Clarify the boundary between git-backed artifact history and deeper
  `git-warp`-backed semantic provenance.

## Open questions

- How much of executive-summary generation should be read-only
  synthesis, and how much belongs in separate maintenance operations?
- What minimum provenance fields should every generated signpost carry?
- Should METHOD standardize behavior spikes as a first-class work
  pattern?
- Where should the line sit between baseline artifact history and
  optional semantic provenance?
- How much legend coverage should METHOD expect by default, versus
  leaving to repo-local judgment?

## Limits

This document is a bounded synthesis over repo-visible artifacts. It is
grounded in artifact history only. It does not claim semantic
provenance, observation lineage, or replay beyond the source surfaces
named in the frontmatter.
