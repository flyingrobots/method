---
title: "CLI Module Split"
legend: PROCESS
---

Source backlog item: `docs/method/backlog/asap/PROCESS_cli-module-split.md`


## Sponsors

- Human: I can inspect the CLI and find command parsing, workspace
  mutations, drift logic, and file-collection behavior in separate,
  named modules instead of spelunking a 1,000-line monolith.
- Agent: I can change one CLI behavior with a narrow edit scope because
  the code is split by owned behavior, not piled into a single entry
  file or dissolved into vague utility soup.

## Hill

METHOD keeps the current CLI command surface and behavior, but
reorganizes the implementation so `src/cli.ts` becomes a thin entry
point and runtime-owned modules carry argument parsing/help, workspace
operations, and drift detection in separate homes while workspace-local
document scaffolding stays with the workspace module unless it becomes
independently meaningful.

## Playback Questions

### Human

- [ ] Can I open the CLI code and identify where argument parsing ends
      and workspace behavior begins without reading the whole command
      stack top to bottom?
- [ ] If I need to review or change only drift behavior, can I find that
      logic in one small module instead of tracing through unrelated
      `init`, `pull`, `close`, and `status` code?

### Agent

- [ ] Does `src/cli.ts` stay a thin entry point that wires command
      parsing and execution together rather than owning most of the
      runtime behavior itself?
- [ ] Are the resulting modules named by owned behavior, with stable
      tests proving that the CLI still preserves its existing contract?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: the module layout should be
  readable in a terminal or plain editor. File names should describe the
  behavior they own so a reviewer can follow the CLI flow without IDE
  indexing.
- Non-visual or alternate-reading expectations: this cycle should reduce
  navigation burden for screen-reader users, terminal-only operators,
  and agents by shortening files and making the seams more explicit in
  committed paths and test names.

## Localization and Directionality

- Locale / wording / formatting assumptions: internal symbol and module
  names may remain English. No localization work is part of this cycle.
- Logical direction / layout assumptions: the split should improve code
  navigation through textual structure, not left/right editor panes or
  IDE-specific affordances.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the module
  boundaries and moved responsibilities must be committed in the repo.
  A reviewer should be able to point to a concrete file for CLI entry,
  arg parsing/help text, workspace operations, drift behavior, and the
  workspace-local scaffolding those behaviors still depend on.
- What must be attributable, evidenced, or governed: tests must prove
  the CLI contract still holds after the split. This cycle should not
  hide behavioral changes inside a refactor. If outputs or command
  semantics change, that change needs an explicit test and design note.

## Non-goals

- [ ] Adding new CLI commands or changing the current command surface.
- [ ] Introducing a large public library API for the internal modules.
- [ ] Converting the repo away from TypeScript or rewriting the CLI in
      plain JavaScript as part of this cycle.
- [ ] Sneaking in drift-feature expansion such as near-miss hints,
      witness packaging, or broader test discovery.
- [ ] Splitting the file into generic `utils` buckets that weaken
      ownership instead of clarifying it.

## Decisions To Make

- Which module boundaries are real enough to earn first-class files in
  this cycle.
  Final direction: split by owned behavior, not by syntactic category.
  The first cut should likely separate:
  - `src/cli.ts` as entry point plus exported `runCli`
  - `src/cli-args.ts` for parse/help behavior
  - `src/workspace.ts` for workspace mutation/query behavior
  - `src/drift.ts` for playback-question extraction and drift matching
  - `src/fs-helpers.ts` and/or `src/text-helpers.ts` only where a helper
    is genuinely shared and still semantically coherent
- Whether `Workspace` should remain the primary runtime object.
  Current bias: yes. Keep a real runtime-backed workspace type, but make
  it smaller by moving drift-only logic out of the class first.
  Workspace-local document scaffolding and markdown traversal may remain
  in `src/workspace.ts` during this cycle if they stay internal to
  workspace behavior.
- How far to take the split in one cycle.
  Current bias: enough to remove the monolith risk now, not a full
  architectural rewrite.

## Backlog Context

`src/cli.ts` is carrying too many concerns at once: command parsing,
workspace logic, file discovery, markdown extraction, normalization,
and the drift algorithm all live together. Split the CLI into smaller
runtime-owned modules so the code shape matches the repo's own doctrine
about traceability and single responsibility.

Session context:

- The `method drift` PR shipped a useful feature, but review surfaced a
  real structural problem: the CLI entry point is becoming a monolith.
- Current `src/cli.ts` is 1,056 lines and mixes:
  - top-level command execution
  - arg parsing and usage text
  - workspace mutation/query behavior
  - drift extraction and matching
  - recursive file collection
  - markdown parsing and text normalization helpers
- The repo's newer system-style JavaScript doctrine pushes toward
  runtime-owned modules with clear responsibilities. A successful split
  should make the code more honest, not just more fragmented.

What this surfaced:

- `cli.ts` should become a thin entry point that preserves the exported
  CLI contract.
- `Workspace` is still probably the right runtime object, but it should
  stop owning drift-only logic and helper grab-bags.
- The split should be behavior-centered. Replacing one monolith with a
  handful of ambiguous helper files would be a lateral move, not an
  improvement.
- Existing CLI tests give this cycle a strong safety rail: the refactor
  can stay honest by preserving those contracts while tightening file
  boundaries.
