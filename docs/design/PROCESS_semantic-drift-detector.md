---
title: "Semantic Drift Detector"
legend: "PROCESS"
cycle: "PROCESS_semantic-drift-detector"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_semantic-drift-detector.md"
---

# Semantic Drift Detector

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_semantic-drift-detector.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

The drift detector matches playback questions to test descriptions using
three tiers — exact normalization, semantic normalization (strips
question form, backticks, punctuation), and high-confidence token
similarity with stemming — so that conceptually identical pairs pass
without requiring exact prose alignment.

## Playback Questions

### Human

- [ ] Does the drift detector match question-form playback questions against statement-form test descriptions?
- [ ] Does the drift detector match despite backtick differences between questions and test descriptions?

### Agent

- [ ] Does the drift detector treat high-confidence near-misses as semantic matches instead of drift?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: drift output still lists
  unmatched questions with near-miss hints when available.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: English stemming only.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the three
  matching tiers are deterministic (no LLM, no network). Thresholds
  are constants: semantic match >= 0.85, near-miss >= 0.65.
- What must be attributable, evidenced, or governed: the search basis
  line in drift output names the matching strategy.

## Non-goals

- [ ] LLM-based semantic matching (deferred until deterministic matching proves insufficient).
- [ ] Embedding or vector similarity.
- [ ] Changing the drift exit code semantics (0 = clean, 2 = drift).

## Matching Tiers

1. **Exact normalized**: lowercase, collapse whitespace (existing behavior).
2. **Semantic normalized**: also strip backticks, question-word prefixes
   (Does/Is/Can/Will/Are/Do/Has/Have), trailing punctuation.
3. **Token similarity with stemming**: Jaccard similarity on stemmed
   tokens. >= 0.85 = automatic match, 0.65-0.85 = near-miss hint,
   < 0.65 = unmatched.
