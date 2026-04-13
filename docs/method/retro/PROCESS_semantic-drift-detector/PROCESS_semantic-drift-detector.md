---
title: "Semantic Drift Detector"
cycle: "PROCESS_semantic-drift-detector"
design_doc: "docs/design/PROCESS_semantic-drift-detector.md"
outcome: hill-met
drift_check: yes
---

# Semantic Drift Detector Retro

## Summary

Added three-tier matching to the drift detector:
1. Exact normalized match (existing)
2. Semantic normalization — strips backticks, question-word prefixes,
   trailing punctuation
3. Token similarity with minimal stemming — Jaccard on stemmed tokens,
   >= 0.85 auto-matches, 0.65-0.85 near-miss hints

No LLM or network dependency. Purely deterministic. The near-miss
threshold lowered from 0.7 to 0.65 per the backlog item's spec.
Previously-brittle pairs like "Does `X`?" vs "X." now match cleanly.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_semantic-drift-detector/witness` and link them here.

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [ ] Inbox processed
- [ ] Priorities reviewed
- [ ] Dead work buried or merged
