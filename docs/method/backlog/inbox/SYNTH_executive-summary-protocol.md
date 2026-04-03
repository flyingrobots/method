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

## Protocol Specification

### Phase 1: Inventory

1. Enumerate governing surfaces in precedence order:
   - `README.md`
   - repo instructions and `docs/method/process.md`
   - `docs/method/legends/*.md`
   - `docs/design/*/`
   - `docs/method/retro/*/`
   - backlog lanes in priority order
   - `docs/method/graveyard/`
2. Record the exact source list that will ground the synthesis.

### Phase 2: Read and Synthesize

1. Read the inventoried surfaces in order and extract:
   - repo identity and doctrine
   - current state and completed cycles
   - signposts and their roles
   - legends and active domain load
   - roadmap by lane
   - open questions and current limits
2. Generate a bounded signpost with required sections:
   - `Identity`
   - `Current state`
   - `Signposts`
   - `Legends`
   - `Roadmap`
   - `Open questions`
   - `Limits`
3. Keep this phase read-only. Taxonomy changes, backlog edits, or new
   legends are follow-up work, not part of synthesis itself.

### Phase 3: Generate Witness

1. Capture provenance fields for the generated signpost:
   - generation timestamp
   - repo commit SHA
   - source manifest
   - witness reference
   - declared provenance level
2. Store the full session witness outside the signpost body and link to
   it from the signpost metadata.
3. Make every repo-state claim traceable either to a cited source file
   or to the linked verification witness.

### Phase 4: Verification

1. Run repo tests that validate signpost structure and provenance.
2. Run `method status` so the summary can be checked against the repo's
   current visible state.
3. If the synthesis triggers follow-up maintenance ideas, record them as
   separate backlog items after the read-only summary is complete.

What this surfaced:

- METHOD needs a canonical synthesis protocol for "read the repo and
  summarize what it is."
- The protocol should separate read-only synthesis from mutating follow
  up work like taxonomy changes.
- The protocol should tell the generator what sections belong in the
  output and what sources must be cited or witnessed.
