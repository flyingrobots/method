# Executive Summary Protocol

Define a repeatable executive-summary protocol for METHOD repos: inventory governing surfaces, read them in precedence order, synthesize a signpost, and leave a reproducible witness. Keep it repo-generic rather than assuming fixed design.md or retro.md filenames.

Session context:

- In `graft`, an agent was asked for a complete executive summary of the
  repo, including legends, backlog, progress, vision, and non-legend
  work.
- The agent naturally converged on a read order: README, instructions,
  legends, cycle designs, retros, backlog lanes, graveyard.
- The output became `docs/VISION.md`, and the agent documented its
  process inline so it could be repeated later.

What this surfaced:

- METHOD needs a canonical synthesis protocol for "read the repo and
  summarize what it is."
- The protocol should separate read-only synthesis from mutating follow
  up work like taxonomy changes.
- The protocol should tell the generator what sections belong in the
  output and what sources must be cited or witnessed.
