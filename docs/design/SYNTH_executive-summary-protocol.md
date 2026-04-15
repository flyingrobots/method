---
title: "Executive Summary Protocol"
legend: SYNTH
---

# Executive Summary Protocol

Source backlog item: `docs/method/backlog/up-next/SYNTH_executive-summary-protocol.md`
Legend: SYNTH

## Sponsors

- Human: Backlog Operator
- Agent: Sync Automator

## Hill

Formalize the "Executive Summary Protocol" as a first-class METHOD
workflow by documenting it in `docs/method/process.md`, ensuring all
generated signposts can be reproduced using a consistent, read-only
synthesis algorithm.

## Playback Questions

### Human

- [ ] `docs/method/process.md` contains the canonical Executive Summary
  Protocol.
- [ ] The protocol defines clear phases: Inventory, Read and Synthesize,
  Generate Witness, and Verification.

### Agent

- [ ] `docs.test.ts` validates that the protocol specification exists in
  the process doc.
- [ ] `docs.test.ts` validates that `docs/VISION.md` continues to
  conform to the structural requirements of the protocol (e.g., required
  sections like Identity, Current state, etc.).

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: The protocol prescribes a
  predictable section order for summaries, aiding linear consumption.
- Non-visual or alternate-reading expectations: Clear headings and
  phases make the protocol easy to parse for screen readers and agents.

## Localization and Directionality

- Locale / wording / formatting assumptions: The protocol names specific
  English headings (`Identity`, `Roadmap`, etc.) as the baseline
  structure.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The inventory
  precedence order and the extraction rules must be deterministic.
- What must be attributable, evidenced, or governed: The witness
  generation phase ensures all claims are traceable.

## Non-goals

- [ ] Automating the synthesis logic in the `method` CLI (this cycle is
  about formalizing the protocol for manual/agent execution).

## Backlog Context

Define a repeatable executive-summary protocol for METHOD repos: inventory governing surfaces, read them in precedence order, synthesize a signpost, and leave a reproducible witness. Keep it repo-generic rather than assuming fixed design.md or retro.md filenames.

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
