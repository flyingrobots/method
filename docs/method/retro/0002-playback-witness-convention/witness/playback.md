# Playback Witness

Date: 2026-04-02

This was a design cycle. The deliverable is a committed convention plus
doctrine updates, not a new runtime feature.

## Human Playback

### Can I open a past cycle's witness directory and understand what was proven without deep repo archaeology?

Yes.

The cycle now defines a minimum witness packet and this retro uses it:

- `witness/README.md`
- `witness/playback.md`
- `witness/verification.md`

The companion design docs are also bounded and easy to find:

- `docs/design/0002-playback-witness-convention/playback-witness-convention.md`
- `docs/design/0002-playback-witness-convention/witness-artifacts.md`

### Does each witness make the playback answer legible in plain text, even when a richer artifact like a screenshot or trace is also present?

Yes.

This witness packet is plain Markdown end to end. The design now
requires any richer artifact to be paired with text that says what it
proves and whether it is reproducible or merely observational.

## Agent Playback

### Can I generate witness artifacts through repo-native commands and files rather than hidden chat state or ad hoc manual notes?

Yes.

This witness is built entirely from committed Markdown files plus
rerunnable commands captured in [verification.md](./verification.md).
No external state, transient logs, or hidden tool context is required
to understand the proof.

### Do the conventions favor outputs that are both deterministic and reproducible, such as command transcripts, exit codes, JSON, JSONL, TAP, or JUnit, before falling back to richer artifacts?

Yes.

The final doctrine is stronger than the original backlog note:

- if a claimed result cannot be reproduced, it is not done
- observational artifacts may support a witness, but they do not carry
  the done-claim by themselves
- rich media can supplement reproducible proof, not replace it

## Outcome

The hill is met for a design slice. METHOD now has an explicit witness
convention, a companion artifact note, and root-process language that
ties done to reproducible proof.
