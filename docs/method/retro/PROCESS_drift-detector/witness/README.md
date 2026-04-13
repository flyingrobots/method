---
title: "Witness Index"
---

This cycle shipped the first real `method drift` command. The proof
rests on committed code, runnable tests, and reproducible CLI runs that
show both the clean and drift-found cases.

## Artifacts

- [playback.md](./playback.md)
  Human and agent playback answers for the drift-detector cycle.
- [verification.md](./verification.md)
  Reproducible commands showing the new CLI help, clean/drift detector
  behavior, and the post-close repo state.

## Review Notes

- The done-claim is carried by committed code plus rerunnable command
  output.
- The drift-found example is reproduced in a temporary METHOD workspace
  using committed CLI code and committed test-matching rules.
- No screenshot, chat transcript, or one-off observation is carrying
  the proof.
