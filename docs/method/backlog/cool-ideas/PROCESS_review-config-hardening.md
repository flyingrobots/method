# Review Config Hardening

Harden repo review configuration so automated review tools understand
METHOD's actual structure: process docs, design docs, retros, witness
artifacts, backlog lanes, and command/code boundaries. The aim is less
noise, better path-specific guidance, and fewer false "missing
contract" reviews.

Session context:

- PR review of `method drift` surfaced several configuration-level
  recommendations: fix dead guideline paths, add path instructions,
  define custom checks for cycle closeout, and filter evidence-heavy
  witness files from noisy line comments.
- Those recommendations are not all equally urgent, but together they
  point at a real gap between METHOD's repo shape and what review bots
  are being told to expect.

What this surfaced:

- Repo structure should be teachable to review tooling, not just to
  humans.
- Path-aware guidance and custom checks could make automated review much
  more aligned with METHOD's doctrine.
- This is review-surface hardening, not product behavior, so it should
  stay behind more urgent repo-health work like CI and code structure.
