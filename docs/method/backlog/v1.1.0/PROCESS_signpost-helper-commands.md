---
title: "Signpost Helper Commands"
legend: PROCESS
lane: v1.1.0
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines a bounded status/init helper surface for expected signposts."
  - "The first slice names concrete helpers such as signpost status and signpost init for missing canonical signposts."
  - "The contract keeps signpost work explicit and narrower than a full ship sync or full doctor run."
  - "CLI and MCP results name missing signposts, initialized targets, and any skipped paths."
---

# Signpost Helper Commands

METHOD has strong repo-level signpost doctrine, but the operational
surface is still broad: either run ship sync for generated references or
run doctor for everything. There is little support for bounded signpost
maintenance on purpose.

## Proposed Contract

- Surface:
  ship helpers such as
  `method signpost status` and
  `method signpost init <name>`
  plus MCP equivalents.
- Status behavior:
  report which expected signposts exist, which are missing, and which
  are generated versus handwritten.
- Init behavior:
  scaffold narrowly targeted missing signposts such as `docs/BEARING.md`
  or `docs/MCP.md` without pretending to do full repo repair.
- Relationship to ship sync:
  these helpers do not replace `method sync ship` or `method sync refs`;
  they provide a narrower repo-maintenance surface when the operator
  knows signposts are the problem.

## Why It Matters

- Repo signposts are central to METHOD's coordination story.
- Bounded helpers are easier for agents to use safely than a broad
  repair or sync command.
- Missing or stale signposts should be easier to inspect intentionally
  than by reconstructing the answer from unrelated commands.

## Non-goals

- Regenerate every repo-level artifact in one catch-all command.
- Replace the release or ship-sync doctrine.
- Infer repo voice or meaning beyond the existing signpost contracts.
