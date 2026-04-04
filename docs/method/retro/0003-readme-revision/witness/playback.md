---
title: "Playback Witness"
---

Date: 2026-04-02

This was a docs-heavy cycle. The deliverable is a stronger README,
supporting signpost, and executable checks that keep the prose honest.

## Human Playback

### Can I scan the revised README and understand METHOD's stances, design constraints, quality gates, and coordination posture more quickly than before?

Yes.

The README now has explicit sections for:

- `### Stances`
- `### Design constraints`
- `### Quality gates`
- `## Coordination`
- `### BEARING.md`

That structure makes the doctrine easier to navigate than the previous
single-block principles section.

### Does the README explain disagreement and direction-setting without introducing process theater or hidden ceremony?

Yes.

The coordination language stays bounded:

- active work is surfaced through `method status`
- `BEARING.md` is explicitly a signpost, not a commitment source
- disagreement at playback is resolved through the design doc and
  witness, not hierarchy or meetings

## Agent Playback

### Can I use the README to infer what is committed, what counts as done, and how active work is discovered without hitting false or ambiguous claims?

Yes.

The revised copy keeps the hard doctrine that non-reproducible claims
are not done, and it no longer relies on the misleading shortcut
`ls docs/design/` to identify active work. It points to `method status`
instead.

### Do the README's coordination and witness rules stay grounded in files and commands that actually exist in the repo?

Yes.

This cycle added `docs/BEARING.md` so the README is no longer promising
a signpost that does not exist. The docs tests also verify the README
structure and BEARING presence directly.

## Outcome

The hill is met. METHOD's root doctrine is easier to scan, more
complete about coordination, and still strict about reproducible proof.
