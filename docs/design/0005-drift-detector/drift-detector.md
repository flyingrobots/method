---
title: "Drift Detector"
legend: PROCESS
---

Source backlog item: `docs/method/backlog/up-next/PROCESS_drift-detector.md`


## Sponsors

- Human: I can run one detector and see which playback questions in
  METHOD design docs are not reflected in tests, before that drift
  leaks into playback or closeout.
- Agent: I can detect design-to-test drift from repo-visible text and
  deterministic rules, with exact file references and no semantic
  guesswork.

## Hill

METHOD ships a deterministic drift detector that extracts playback
questions from design docs, looks for corresponding test descriptions,
and reports unmatched questions with actionable references before a
cycle is closed.

## Playback Questions

### Human

- [ ] Can I run the detector and get a concise list of playback
      questions that have no matching test evidence, with the design
      file and question text called out directly?
- [ ] When the detector cannot prove a match, does it fail honestly
      instead of pretending semantic certainty?

### Agent

- [ ] Are the extraction and matching rules explicit enough that I can
      reproduce the detector's findings from committed markdown and test
      files alone?
- [ ] Does the detector return stable output and exit semantics that can
      be consumed in automation without a model in the loop?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: findings should read as
  plain text in a stable top-to-bottom order, without requiring table
  layout or color to interpret severity or next action.
- Non-visual or alternate-reading expectations: each finding should be
  self-contained and include the relevant file path and question text so
  a screen-reader user or pipe consumer does not have to reconstruct
  context from surrounding layout.

## Localization and Directionality

- Locale / wording / formatting assumptions: first cut may assume the
  current METHOD design-doc headings (`Playback Questions`, `Human`,
  `Agent`) and checkbox formatting. Supporting localized headings is not
  part of this cycle.
- Logical direction / layout assumptions: matching should rely on
  textual structure and file paths, not left/right or other
  direction-bound presentation.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: playback-question
  extraction rules, test-discovery rules, normalization steps, and exit
  codes must all be encoded directly in code and tests.
- What must be attributable, evidenced, or governed: every reported
  drift finding should name the design doc, the unmatched playback
  question, and the test search basis that failed to match. No model
  calls or hidden heuristics.

## Non-goals

- [ ] Semantic matching of arbitrary prose to arbitrary tests. First cut
      should prefer honest misses over clever false positives.
- [ ] Detecting drift in retros, witnesses, or signposts. This cycle is
      about design-doc playback questions versus tests.
- [ ] Solving localization of design-doc headings or supporting every
      possible test framework on day one.
- [ ] Enforcing repo-policy knobs like legend coverage. That remains a
      separate backlog item.

## Decisions To Make

- How design-doc playback questions should be normalized before matching
  against test descriptions.
- Which test files count in the first cut, and whether matching should
  use literal text, slugs, or both.
- What exit codes and output shape should mean "clean", "drift found",
  and "detector error".

## Backlog Context

Mechanical traceability from design doc to tests.

Extract playback questions from the design doc. Check if corresponding
tests exist. Flag any playback question that doesn't have a test.

Not AI — just pattern matching on markdown headings and test
descriptions. The point is to catch drift before the retro does.
