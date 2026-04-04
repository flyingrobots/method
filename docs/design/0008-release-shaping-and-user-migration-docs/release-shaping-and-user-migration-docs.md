---
title: "Release shaping and user migration docs"
legend: PROCESS
---

Source backlog item: `docs/method/backlog/inbox/PROCESS_release-shaping-and-user-migration-docs.md`


## Sponsors

- Human: I can shape a release deliberately instead of treating tagging
  and changelog edits as an afterthought, and users get a release note
  that tells them what changed, why it matters, and whether they need
  to migrate.
- Agent: I can follow a deterministic release method with explicit
  artifacts, justified versioning, and abort-fast pre-flight rules
  instead of guessing release scope from ad hoc repo state.

## Hill

METHOD defines a release workflow that starts with a release design
artifact, keeps backlog lanes focused on priority rather than version
membership, introduces a user-facing release note and migration surface,
and codifies a deterministic release pre-flight/runbook that can later
be automated without changing the doctrine.

## Playback Questions

### Human

- [ ] Can I point to one METHOD artifact that defines what a release
      includes, why the version number is justified, and whether users
      need migration guidance before anything is tagged?
- [ ] When a release ships, do users get a dedicated release note that
      is more guided than `CHANGELOG.md` and explicitly says what
      changed, why it matters, and whether migration is required?

### Agent

- [ ] Does the release method keep cycle/backlog topology intact by
      treating releases as aggregations of shipped work rather than
      moving backlog items into version-named directories?
- [ ] Is there a deterministic, sequential release pre-flight that says
      what must be discovered, validated, tagged, published, and
      verified, with clear abort conditions and no implied success?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: the release doctrine
  should separate terse ledger material from guided user-facing release
  notes so a reader can choose the right surface without scanning long
  changelog sediment.
- Non-visual or alternate-reading expectations: release artifacts
  should be plain markdown with explicit headings, migration verdicts,
  and links to deeper evidence so terminal users, screen-reader users,
  and agents can follow the release path without graphical tooling.

## Localization and Directionality

- Locale / wording / formatting assumptions: release notes may remain
  English in this repo, but they must use explicit section labels and
  avoid culture-specific shorthand for upgrade risk.
- Logical direction / layout assumptions: the release method should be
  structurally legible in text form and not depend on dashboard layout
  or GitHub-specific UI ordering.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the required
  release artifacts, their filesystem locations, the relationship
  between internal release design and user-facing release notes, and the
  sequence of pre-flight validation steps must be committed in repo
  doctrine.
- What must be attributable, evidenced, or governed: release version
  justification, included shipped cycles, migration requirements,
  validation commands, and publish verification must all be named in the
  release packet rather than inferred from memory or commit vibes.

## Non-goals

- [ ] Turning every cycle into a release.
- [ ] Moving backlog items into version-numbered directories.
- [ ] Forcing `README.md` to accumulate per-version release sections.
- [ ] Shipping a full release automation CLI in this cycle.
- [ ] Making GitHub-specific workflow details the core of METHOD
      doctrine.

## Decisions To Make

- Which release artifacts become required and where they live.
  Current direction:
  - `docs/method/releases/vX.Y.Z/release.md` for internal release
    design and acceptance
  - `docs/method/releases/vX.Y.Z/verification.md` for release witness
    and pre-flight/publish evidence
  - `docs/releases/vX.Y.Z.md` for user-facing release notes and
    migration guidance
  - `CHANGELOG.md` remains the ledger, not the primary guided release
    surface
- Whether releases should reshape backlog topology.
  Final direction: no. Releases aggregate shipped work; they do not
  create `backlog/<version>/` directories or move backlog items by
  version.
- How version numbers are justified.
  Current bias: the release design names and justifies the intended
  version first; commit history and technical diff validate that choice
  during pre-flight rather than silently owning the decision.
- How much of the universal pre-flight belongs in METHOD doctrine.
  Current bias: keep the doctrine in `docs/method/release.md` concise
  and principled, then place the fully explicit step-by-step runbook in
  a separate release runbook artifact that can later be automated.

## Backlog Context

METHOD needs a clearer way to shape releases, not just cycles. Alongside
`CHANGELOG.md`, the repo should have a structured, user-facing release
surface that explains what is new in a release, why it matters, and how
to migrate from previous versions when migration is required.

Session context:

- The current release doctrine is intentionally light: `release.md`
  says releases happen when externally meaningful behavior changes and
  points at `CHANGELOG.md` plus `README.md`.
- That is enough for honesty, but it is not enough for user-facing
  release communication. Changelogs are ledger-like. Users often need a
  more guided document: what changed, what to look at first, what might
  break, and what to do next.
- The gap is especially visible for infrastructure repositories where a
  release may change doctrine, CLI behavior, file layout, or expected
  workflow. A terse changelog entry is not always the right surface for
  helping a user adopt that release.

Questions this should answer:

- What makes a release “shaped” rather than just tagged and logged?
- What artifact should accompany a real release besides
  `CHANGELOG.md`?
- Should METHOD define a user-facing release note format such as:
  summary, what changed, why it matters, breaking changes,
  migration/upgrade steps, and links to deeper docs?
- When should a release include explicit migration guidance versus “no
  migration required”?
- Where should these artifacts live: `docs/releases/`, a generated
  release page, versioned markdown files, or something else?
- How should release shaping relate to cycle closeout and post-merge
  ship sync?

What this surfaced:

- METHOD currently knows how to close cycles honestly, but not yet how
  to present releases coherently to users.
- `CHANGELOG.md` is necessary, but not always sufficient as the primary
  user-facing release document.
- A structured release note / migration surface could become part of the
  release method without turning every cycle into release theater.
