# Process

METHOD cycles run as a calm pull-design-test-playback-close-review-ship-sync loop.

## Rules

- Pulling work is commitment. The backlog item does not go back.
- Playback questions drive the design and the tests.
- Designs must name their accessibility/assistive posture,
  localization/directionality posture, and agent inspectability posture
  explicitly, even if the answer is "not in scope."
- If a claimed result cannot be reproduced, it is not done.
- Drift is checked explicitly at close, not hand-waved after the fact.
  Invariant preservation is part of the drift check.
- Backlog maintenance happens at cycle boundaries, not continuously.
- Repo-level ship surfaces such as `BEARING.md` and `CHANGELOG.md`
  reflect merged `main` state, not branch-local closeout state.
- Review visibility is currently outside METHOD's repo-native
  coordination surface; branch and PR context carry it for now.
- All cycle work must be done on a branch named `cycles/<cycle_name>`.
- Once a full cycle is complete (after the retro), the operator must
  push the branch and open a PR to the target branch (usually `main`).
- Agents must stage and commit all modified files at the end of each turn
  to maintain a transparent and recoverable session history.

## Default Loop

1. Pull an item from the backlog into `docs/design/<cycle>/`.
2. Write the design with both human and agent sponsors named as
   abstract roles (e.g., "System Architect", "Workflow Automator"), 
   plus the accessibility, localization, and agent-inspectability 
   contract.
3. Write failing tests from the playback questions.
4. Make the tests pass.
5. Produce a reproducible playback witness, including reduced/
   linearized, localized, or agent-facing paths when the hill claims
   them. A purely observational artifact may support the witness, but
   it does not satisfy done on its own.
6. Close the cycle packet with a retro in `docs/method/retro/<cycle>/`.
7. Review the complete cycle packet on a branch or PR.
8. After merge, update repo-level ship surfaces on `main` such as
   `BEARING.md`, `CHANGELOG.md`, and release notes when relevant.

## Workflow

METHOD uses Git for distributed coordination but remains forge-agnostic.

### Branch Naming

- **Cycle Branches:** Use the full cycle name: `####-slug` (e.g.,
  `0015-git-branch-workflow-policy`).
- **Maintenance Branches:** Use `maint-slug` for low-risk changes that
  require review (e.g., `maint-fix-typos`).
- **Triage/Backlog:** Small backlog captures or moves can happen
  directly on `main` or on a `triage-slug` branch.

### The Cycle Lifecycle

1. **Pull:** Pull the backlog item.
2. **Branch:** Create a cycle branch from the latest `main`.
3. **Execute:** Perform the loop (design, tests, act, playback).
4. **Close:** Run `method close` to write the retro and witness metadata.
5. **Merge:** Open a PR/Review. Once approved, merge to `main`.

### The Ship Sync Maneuver

After a cycle branch is merged to `main`, the operator (human or agent)
must perform a **Ship Sync** to update the repo's public signposts:

1. **Sync:** Pull the merged `main` local machine.
2. **Update BEARING:** Refresh `docs/BEARING.md` to reflect the current
   priority and recent ships.
3. **Update CHANGELOG:** Add the changes to `CHANGELOG.md`.
4. **Refresh VISION:** If significant, run the Executive Summary
   Protocol to refresh `docs/VISION.md`.
5. **Commit:** Push these updates directly to `main`.

## System-Style JavaScript

METHOD adopts the "System-Style JavaScript" standard to ensure
architectural integrity and runtime authority.

### Core Principles

- **Runtime Truth:** Boundary data must be validated at runtime. Use Zod
  schemas in `src/domain.ts` to define the system's "Domain Forms."
- **Hexagonal Architecture:** Keep the core domain logic (in `src/index.ts`)
  clean and separate from presentation adapters (CLI) and
  infrastructure (filesystem, GitHub API).
- **Browser-First Portability:** The core domain logic should avoid
  Node-specific APIs. Use adapters to bridge to Node or Web
  environments.
- **Lint is Law:** Strict linting and formatting are enforced to reduce
  meaningless diff noise and ensure consistent style.
- **Honest Design:** Don't use "just-in-case" abstractions. Abstractions
  must buy their way into the repo by proving they reduce complexity or
  enforce an invariant.

## Special Cycles

### Executive Summary Protocol

A specialized cycle for "reading the repo and summarizing what it is." This protocol ensures that generated signposts like `docs/VISION.md` are reproducible and grounded in artifact history.

#### Phase 1: Inventory

1. Enumerate governing surfaces in precedence order:
   - `README.md`
   - repo instructions and `docs/method/process.md`
   - `docs/method/legends/*.md`
   - `docs/design/*/`
   - `docs/method/retro/*/`
   - backlog lanes in priority order
   - `docs/method/graveyard/`
2. Record the exact source list that will ground the synthesis.

#### Phase 2: Read and Synthesize

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
3. Keep this phase read-only. Taxonomy changes, backlog edits, or new legends are follow-up work, not part of synthesis itself.

#### Phase 3: Generate Witness

1. Capture provenance fields for the generated signpost:
   - generation timestamp
   - repo commit SHA
   - source manifest
   - witness reference
   - declared provenance level
2. Store the full session witness outside the signpost body and link to it from the signpost metadata.
3. Make every repo-state claim traceable either to a cited source file or to the linked verification witness.

#### Phase 4: Verification

1. Run repo tests that validate signpost structure and provenance.
2. Run `method status` so the summary can be checked against the repo's current visible state.
3. If the synthesis triggers follow-up maintenance ideas, record them as separate backlog items after the read-only summary is complete.

### Behavior Spikes

A specialized cycle for temporary implementations that exist to prove behavior, buy clarity, or surface stack constraints.

#### Phase 1: Capture

1. Record the goal, stack constraints, and the "why" in a backlog item.
2. Explicitly tag the item as a `SPIKE` (e.g., `SPIKE_my-experiment`).

#### Phase 2: Execute

1. Build the minimum implementation necessary to prove the behavior.
2. Don't worry about production-grade hardening, but keep the core
   honest.

#### Phase 3: Witness

1. Produce a playback witness (transcript, demo, test results) that
   proves the behavior was achieved or the constraint was identified.
2. Close the cycle with a retro explaining what was learned and whether
   the approach should be adopted, adapted, or retired.

#### Phase 4: Retire

1. Honestly discard or replace the implementation.
2. If retired, move artifacts to `docs/method/graveyard/`.
3. If adopted, replace the spike with a formal design cycle.
