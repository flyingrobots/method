---
title: "Missing METHOD API surfaces found during repo work"
captured_at: "2026-04-11"
source: "Cross-repo usage while working in warp-ttd, Echo, Wesley, Continuum, and git-warp"
status: "archived"
---

# Missing METHOD API surfaces found during repo work

## What this feedback is

Concrete feedback from actually trying to use METHOD as the process
surface while doing real cross-repo work.

The current CLI/MCP surface is useful for inspection and a few
workflow-native operations, but there are several recurring places
where the absence of an API pushes work back into direct filesystem
edits.

That drift matters because METHOD's own doctrine says the agent surface
should be explicit and inspectable.

## Where it came from

Captured while:

- seeding backlog items across multiple repos
- writing feedback and process notes
- running `method_doctor` and interpreting its output
- trying to decide when direct file edits were acceptable fallback
  versus when a METHOD-native operation should exist

## Concrete observations

### 1. No general backlog-authoring API

Current surface:

- `method inbox <idea>` exists
- `method pull <item>` exists

Missing:

- create a structured backlog note directly in a chosen lane
- supply title/body/frontmatter/legend/lane intentionally
- create a backlog note from an agent/tool without dropping to manual
  file creation

This gap shows up constantly for:

- `up-next/` follow-on notes
- `bad-code/` smells found during implementation
- `cool-ideas/` notes worth preserving without making them backlog root

Desired surface:

- `method backlog add --lane up-next --title ... --body-file ...`
- MCP equivalent for structured backlog note creation

### 2. No repair/fix API for doctor findings

Current surface:

- `method doctor` diagnoses
- `method init` scaffolds a fresh workspace

Missing:

- safe repair of missing directories/files in an existing workspace
- frontmatter bootstrapping/stubbing
- repair planning with dry-run output

This is the most obvious gap when `doctor` reports dozens of
structure/frontmatter issues but the tool provides no first-class
repair path.

Desired surface:

- `method fix --safe`
- or `method repair --plan` / `method repair --apply`

Safe fix classes should probably include:

- create missing required directories
- create missing required scaffold files
- add minimal frontmatter stubs to METHOD packet markdown
- optionally move orphaned backlog docs into a nominated lane

### 3. No feedback capture API

There is a `docs/method/feedback/` workflow, but no obvious CLI/MCP
command for capturing feedback into that inbox.

That means the repo has a named concept with no first-class agent
surface.

Desired surface:

- `method feedback add --title ... --body-file ...`
- optional metadata flags like `--source`, `--captured-at`, `--from`

### 4. No structured backlog triage/move API

There is `pull`, but not much for everyday backlog hygiene such as:

- move a note from `inbox/` to `up-next/`
- move a note from backlog root into a lane
- retire a note to `graveyard/`
- archive processed feedback with a disposition note

This leaves common METHOD maintenance operations outside the tool
surface even though they are very filesystem-shaped and deterministic.

Desired surface:

- `method move <path> --to up-next`
- `method retire <path> --reason ...`
- `method feedback archive <path> --disposition-file ...`

### 5. No explicit signpost maintenance helpers

There is `sync ship`, which is broad, but not much for bounded,
explicit signpost work while staying inside METHOD language.

Examples:

- add or refresh `docs/BEARING.md`
- scaffold missing signposts such as `docs/MCP.md`
- report which expected signposts are missing in a more targeted way
  than the full doctor run

Desired surface:

- `method signpost status`
- `method signpost init BEARING`
- `method signpost init MCP`

### 6. MCP parity is incomplete for METHOD-native mutations

The MCP surface is strong for inspection, but the mutation side is
still thin in the places where agents most often need to stay inside
METHOD instead of dropping to manual edits.

The missing operations above should be available through MCP as well,
not only the CLI.

## Suggestions

Priority order I would want:

1. backlog note creation in arbitrary lanes
2. doctor repair/fix plan + apply
3. feedback capture
4. backlog move/retire/archive operations
5. signpost helpers

## Why this matters

Right now the tool encourages a split brain:

- inspect with METHOD
- mutate by editing files directly

That is workable, but it weakens METHOD's claim to be the explicit
agent surface for process.

The more deterministic repo-shape operations METHOD can own directly,
the less often agents and humans need to improvise around the method
instead of through it.

## Disposition

Accepted as `v1.1.0` planning input on 2026-04-11.

Created backlog notes:

- `PROCESS_backlog-authoring-command`
- `PROCESS_backlog-move-command`
- `PROCESS_doctor-repair-command`
- `PROCESS_feedback-command`
- `PROCESS_signpost-helper-commands`

Moved related existing backlog notes into `docs/method/backlog/v1.1.0/`:

- `PROCESS_task-dependency-dag`
- `PROCESS_retire-command`
- `PROCESS_structured-repair-hints`

The feedback document now belongs in the archive because its accepted
points have been converted into explicit backlog work rather than left
as a live unprocessed note.
