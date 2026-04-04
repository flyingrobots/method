# Legend: SYNTH

How a METHOD repo understands and explains itself: executive summaries,
generated signposts, and the history or provenance that makes those
artifacts trustworthy.

## Invariants guarded

- [signpost-provenance](../../invariants/signpost-provenance.md) —
  generated signposts cite their sources and generation context.
- [signpost-boundedness](../../invariants/signpost-boundedness.md) —
  signposts live at root or one level into `docs/` and never create
  commitments.

## What it covers

- repo-wide synthesis protocols such as `VISION.md`
- generated signpost structure and provenance
- source manifests, witness linkage, and generation metadata
- the boundary between artifact-level history and deeper semantic
  provenance
- tooling that inventories METHOD surfaces and turns them into bounded,
  reproducible project understanding

## What success looks like

A METHOD repo can generate trustworthy self-description without hiding
where it came from. Humans and agents can inspect what the project is,
what informed that summary, and how to reproduce it.

## How you know

- generated signposts cite their source surfaces and generation context
- synthesis workflows are repeatable across METHOD repos
- signposts stay readable while linking to deeper witness/provenance
  artifacts
- provenance claims are explicit about whether they come from artifact
  history alone or richer semantic memory
