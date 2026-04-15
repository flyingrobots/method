---
title: "Drift Near-Miss Hints"
outcome: hill-met
drift_check: yes
---

# Drift Near-Miss Hints Retro

Design: `docs/design/0023-drift-near-miss-hints/drift-near-miss-hints.md`
Outcome: hill-met
Drift check: yes

## Summary

Added near-miss hints to `method drift`. When a playback question has
no exact normalized match but a test description shares enough tokens
(Jaccard similarity >= 0.7), the drift output now shows the closest
candidate as a "Near miss" hint. Exit codes are unchanged — drift with
hints still exits 2.

The feature uses deterministic punctuation-stripped token overlap with
no external dependencies. This solves the immediate pain where
playback questions with minor wording differences (backticks, extra
words) appeared as complete misses.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- Make the similarity threshold configurable via `.method.json`.
- Show the similarity score alongside the hint for transparency.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
