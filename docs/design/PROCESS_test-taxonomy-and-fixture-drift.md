---
title: "Test Taxonomy And Fixture Drift"
legend: "PROCESS"
cycle: "PROCESS_test-taxonomy-and-fixture-drift"
source_backlog: "docs/method/backlog/bad-code/PROCESS_test-taxonomy-and-fixture-drift.md"
---

# Test Taxonomy And Fixture Drift

Source backlog item: `docs/method/backlog/bad-code/PROCESS_test-taxonomy-and-fixture-drift.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

The committed test suite proves the live METHOD legend taxonomy used by
this repo, and any remaining non-doctrine fixture is explicitly named as
a serialization or compatibility case rather than silently looking like
current process truth.

## Playback Questions

### Human

- [ ] Does `method pull` preserve live legends in scaffolded design docs
      instead of carrying obsolete fixture taxonomy?
- [ ] Does `method status` report legend health using the live repo
      legends rather than stale historical codes?

### Agent

- [ ] Does design-doc frontmatter YAML-escape raw legend scalar
      compatibility text instead of letting it masquerade as live
      taxonomy?
- [ ] Does `shipSync()` stay idempotent when the closed-cycle fixtures
      use live repo legends instead of stale feature labels?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: test names and fixture text
  should state whether they are doctrine fixtures or compatibility
  fixtures, so a linear read does not require inferred intent.
- Non-visual or alternate-reading expectations: avoid relying on
  filename prefix folklore alone; expectations should be readable from
  the test body and the rendered markdown under test.

## Localization and Directionality

- Locale / wording / formatting assumptions: legend codes and frontmatter
  keys remain ASCII tokens; the cleanup should not introduce
  locale-sensitive casing or formatting behavior.
- Logical direction / layout assumptions: no UI layout changes are in
  scope; this cycle is about deterministic repo text fixtures and their
  semantics.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: whether a fixture
  is meant to reflect current repo taxonomy or a bounded serializer /
  compatibility edge case.
- What must be attributable, evidenced, or governed: each remaining
  non-doctrine value should be justified by the test title or
  surrounding expectation rather than surviving as unexplained drift.

## Non-goals

- [ ] Expanding the repo's live legend set beyond `PROCESS` and `SYNTH`.
- [ ] Rewriting historical design or retro documents outside the active
      test suite.
- [ ] Changing runtime legend parsing rules unless the fixture cleanup
      proves a real code defect.

## Backlog Context

Several tests still seed obsolete legend codes like `PROTO`, `VIZ`,
`TUI`, and `FEAT`, and they create markdown fixtures that do not follow
the current frontmatter expectations. The committed docs suite, README,
and backlog conventions now claim a tighter live taxonomy than the tests
exercise.

That makes the suite partially validate an older METHOD than the one the
repo documents. Fixtures should either reflect the current doctrine or
be clearly marked as compatibility cases rather than silent drift.
