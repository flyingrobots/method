# Drift Near-Miss Hints

Keep exact normalized matching as the authority for `method drift`, but
explore whether the tool should report near misses as hints when a
playback question is close to a test description. This should never
change pass/fail semantics; it is only about reducing operator friction
when the mismatch is obvious.

Session context:

- Review of the `drift-detector` cycle pointed out a practical rough
  edge: exact matching is intentionally strict, but the current report
  gives no hint when the intended test description is only one or two
  edits away.
- The design doc explicitly deferred near-miss detection, so this is
  follow-up work, not a bug in the shipped contract.

What this surfaced:

- The detector should stay exact and deterministic.
- Hints, if added, must be clearly secondary and never auto-satisfy a
  playback question.
- This is useful ergonomics, but it should not outrank the honest
  contract.
