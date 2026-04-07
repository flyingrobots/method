---
title: "CLI Reference"
---

# CLI Reference

The `method` command is the primary interface for METHOD workspace
operations. Run `method help` for a quick summary or
`method help <command>` for command-specific usage.

## Commands

### `method init [path]`

Scaffold a METHOD workspace in the given directory. Creates all
backlog lanes, design/retro directories, legends, graveyard, release
surfaces, and placeholder docs (process.md, release.md, CHANGELOG.md).

If a `.method.json` file exists at the target path with a `paths`
section, the scaffolding uses those custom paths instead of the
defaults.

```bash
method init                 # scaffold in current directory
method init ~/projects/foo  # scaffold in a specific directory
```

### `method inbox <idea> [--legend CODE] [--title TITLE]`

Capture a raw idea into the inbox. The idea text becomes the file
body. An optional legend code prefixes the filename. An optional title
overrides the heading (and slug) derived from the idea text.

```bash
method inbox "Support GitLab sync"
method inbox "Extract hardcoded strings" --legend PROCESS
method inbox "Braille rendering" --legend VIZ --title "Braille Renderer"
```

### `method pull <item>`

Promote a backlog item into the next numbered design cycle. The
backlog file is removed and a design doc is created under
`docs/design/<cycle>/`. Matches by filename, stem, or
case-insensitive stem.

```bash
method pull PROCESS_drift-near-miss-hints
method pull drift-near-miss-hints
```

### `method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]`

Close an active cycle. Generates a retro doc and a verification
witness (test output + drift results). If `--drift-check` is omitted,
the CLI prompts interactively.

The cycle argument is optional when exactly one cycle is active. It
matches by full name, slug, or suffix.

```bash
method close --drift-check yes --outcome hill-met
method close 0025-configurable-workspace-paths --drift-check yes --outcome partial
```

### `method drift [cycle]`

Check active cycle playback questions against test descriptions in
`tests/`. Uses exact normalized matching. When a question has no exact
match but a test description is close (Jaccard token similarity
>= 0.7), a near-miss hint is shown.

- Exit 0: no drift found.
- Exit 2: drift found.

```bash
method drift
method drift 0025-configurable-workspace-paths
```

### `method status`

Show backlog lanes, active cycles, and legend health. This is the
"what is going on?" query.

```bash
method status
```

### `method mcp`

Start a Model Context Protocol server on stdio. The server exposes
all METHOD operations as tools. See `docs/MCP.md` for the tool
reference.

```bash
method mcp
```

### `method sync github [--push] [--pull]`

Synchronize backlog items with GitHub Issues. Requires `github_token`
and `github_repo` in `.method.json` or environment variables.

- `--push` (default): Create or update GitHub issues from local
  backlog files.
- `--pull`: Update local files with remote labels, comments, and
  status. Moves closed issues to the graveyard.
- Both flags: push first, then pull.

```bash
method sync github              # push only (default)
method sync github --push --pull # both directions
method sync github --pull        # pull only
```

### `method sync ship`

Perform the Ship Sync maneuver after merging a cycle to `main`.
Updates `CHANGELOG.md` with newly shipped cycles and refreshes
`docs/BEARING.md` with current direction and recent ships.

```bash
method sync ship
```

## Configuration

The CLI reads `.method.json` from the workspace root for:

- `paths` — custom directory layout (see `ARCHITECTURE.md`)
- `github_token` / `github_repo` — GitHub adapter credentials
- Environment overrides: `GITHUB_TOKEN`, `GITHUB_REPO`

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (bad arguments, missing workspace, failed operation) |
| 2 | Drift found (from `method drift`) |
