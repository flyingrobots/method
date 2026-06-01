---
title: "Artifact History And Semantic Provenance"
legend: SYNTH
lane: cool-ideas
---

Define two provenance levels for METHOD instead of treating everything
as one generic backend question.

- `ArtifactHistory` is the baseline layer: git plus filesystem-visible
  artifacts. It answers file-level history questions such as commit,
  changed files, linked witnesses, generated-at metadata, and which
  source artifacts informed a generated signpost.
- `SemanticProvenance` is the advanced layer: meaning-level lineage,
  observation history, structural change, and project-memory questions
  that go beyond raw git history.

Use this split to define what METHOD requires from every repo and what
becomes possible only with a richer substrate such as `git-warp`.

Session context:

- In `graft`, once executive synthesis, frontmatter, appendix links, and
  legend assignment started to matter, the conversation naturally
  drifted toward project provenance: where did this summary come from,
  what did the agent read, what changed, and how should that history be
  tracked?
- That raised the broader METHOD question: git gives artifact history,
  but not really provenance. If METHOD wants deeper project memory,
  should it distinguish `ArtifactHistory` from `SemanticProvenance`,
  with `git-warp` as the likely reference implementation for the latter?

What this surfaced:

- METHOD likely wants an explicit artifact-history contract before it
  defines advanced semantic provenance.
- `git-warp` may be the only serious implementation path for
  `SemanticProvenance` right now, but METHOD should still define the
  boundary cleanly instead of collapsing doctrine into one product.
- The baseline layer should stay honest: artifact history is valuable,
  but it is not the same thing as semantic provenance.
