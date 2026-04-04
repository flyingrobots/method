---
title: "Playback Witness"
---

Date: 2026-04-03

This was a feature cycle. The deliverable is a deterministic first cut
of `method drift`, backed by explicit matching rules and stable exit
semantics.

## Human Playback

### Can I run the detector and get a concise list of playback questions that have no matching test evidence, with the design file and question text called out directly?

Yes.

The detector emits a compact report that names:

- the design doc path
- each unmatched `Human` or `Agent` playback question
- the failed search basis

The reproducible drift-found example in
[verification.md](./verification.md) shows that shape directly:

- `docs/design/0001-drift-detector/drift-detector.md`
- `Human: Can I see a concise drift report?`
- `Agent: Does a near miss still count as unmatched?`
- `No exact normalized test description match found.`

### When the detector cannot prove a match, does it fail honestly instead of pretending semantic certainty?

Yes.

The first cut uses exact normalized text matching only. Near misses are
reported as drift instead of being guessed into a false clean result.
The verification witness includes a near-miss case that exits `2` and
reports both unmatched questions explicitly.

## Agent Playback

### Are the extraction and matching rules explicit enough that I can reproduce the detector's findings from committed markdown and test files alone?

Yes.

The implementation is fully deterministic:

- parse `## Playback Questions`
- read `### Human` and `### Agent` subsections
- collect `- [ ]` question bullets, including wrapped lines
- normalize whitespace/case
- compare against normalized `it(...)` / `test(...)` descriptions in
  committed test files

The CLI tests also cover wrapped markdown questions and escaped quotes,
so the matching rules are committed and inspectable rather than implied.

### Does the detector return stable output and exit semantics that can be consumed in automation without a model in the loop?

Yes.

The command contract is stable in this first slice:

- `0` means clean
- `2` means drift found
- `1` means operator or usage error

`method help drift` documents the command surface, and the clean/drift
examples in [verification.md](./verification.md) show the expected
output shape without a model in the loop.

## Outcome

The hill is met for the first slice. METHOD now has a repo-native drift
detector that checks active-cycle playback questions against test
descriptions, reports honest misses, and leaves the broader history,
witness, and semantic-matching problems for later cycles.
