# Architecture

METHOD is a TypeScript CLI and library that implements the METHOD
development workflow. It follows a hexagonal architecture: domain logic
in the core, adapters for external systems, and a thin CLI shell.

## Source Layout

```
src/
  index.ts              Workspace class — core domain logic
  domain.ts             Zod schemas, types, and lane definitions
  config.ts             .method.json loader with Zod validation
  errors.ts             MethodError class
  drift.ts              Playback-question drift detection
  cli.ts                CLI entry point and command dispatch
  cli-args.ts           Argument parsing and usage text
  cli-renderer.ts       Terminal output formatting
  mcp.ts                MCP server (Model Context Protocol)
  adapters/
    github.ts           GitHub Issues sync adapter (push/pull)
```

## Key Modules

### `index.ts` — Workspace

The `Workspace` class is the core. It owns:

- **Backlog operations**: `captureIdea`, `pullItem`, `moveBacklogItem`
- **Cycle lifecycle**: `closeCycle`, `openCycles`, `captureWitness`
- **Drift detection**: `detectDrift` (delegates to `drift.ts`)
- **Ship sync**: `shipSync` (updates CHANGELOG and BEARING)
- **Status**: `status` (backlog lanes, active cycles, legend health)

All paths are resolved from `this.config.paths`, which is configurable
via `.method.json`. The `initWorkspace` function scaffolds directories
and placeholder files.

### `domain.ts` — Types

Defines the core vocabulary: `Lane`, `Cycle`, `BacklogItem`, `Outcome`,
`WorkspaceStatus`, `LegendHealth`. Uses Zod for runtime validation.

### `config.ts` — Configuration

Loads `.method.json` from the workspace root. Supports:

- `paths` — configurable directory layout (backlog, design, retro,
  tests, graveyard, method_dir)
- `github_token` / `github_repo` — GitHub adapter credentials
- Environment variable overrides (`GITHUB_TOKEN`, `GITHUB_REPO`)

All path fields have defaults matching the standard METHOD layout.

### `drift.ts` — Drift Detection

Compares playback questions from active cycle design docs against test
descriptions extracted from `it()` / `test()` calls. Uses exact
normalized matching with near-miss hints (Jaccard token similarity)
for close-but-not-exact matches.

### `cli.ts` — CLI Entry Point

Dispatches commands parsed by `cli-args.ts`. The `runCli` function
accepts injectable I/O for testing. The entry point guard uses
`realpathSync` to handle npm-linked symlinks.

### `mcp.ts` — MCP Server

Exposes METHOD tools over the Model Context Protocol (stdio transport).
Every tool requires a `workspace` parameter — the absolute path to the
METHOD workspace root. A single MCP server instance can serve multiple
projects.

### `adapters/github.ts` — GitHub Sync

Two-way sync between the local backlog and GitHub Issues:

- **Push**: Creates or updates GitHub issues from local backlog files.
  Strips `## GitHub Comments` before sending to avoid mirroring.
- **Pull**: Updates local files with remote labels, comments, and
  status. Moves closed issues to the graveyard.

## CLI Commands

| Command | Description |
|---------|-------------|
| `method init [path]` | Scaffold a METHOD workspace. |
| `method inbox <idea> [--legend CODE] [--title TITLE]` | Capture a raw idea in `inbox/`. |
| `method pull <item>` | Promote a backlog item into the next numbered cycle. |
| `method close [cycle] [--drift-check yes\|no] [--outcome ...]` | Write a retro for an active cycle. |
| `method drift [cycle]` | Check playback questions against test descriptions. |
| `method status` | Show backlog lanes, active cycles, and legend health. |
| `method mcp` | Start the MCP server over stdio. |
| `method sync github [--push] [--pull]` | Sync backlog with GitHub Issues. |
| `method sync ship` | Update CHANGELOG.md and BEARING.md. |

## MCP Tools

All tools require `workspace` (absolute path to the METHOD root).

| Tool | Parameters | Description |
|------|-----------|-------------|
| `method_status` | — | Get workspace status as JSON. |
| `method_inbox` | `idea`, `legend?`, `title?` | Capture an idea. |
| `method_pull` | `item` | Promote a backlog item into a cycle. |
| `method_drift` | `cycle?` | Check playback-question drift. |
| `method_close` | `cycle?`, `driftCheck`, `outcome` | Close a cycle. |
| `method_sync_ship` | — | Perform ship sync. |
| `method_sync_github` | `push?`, `pull?` | Sync with GitHub Issues. |
| `method_capture_witness` | `cycle?` | Capture verification witness. |

## Testing

Tests live in `tests/` and use Vitest. Each test file creates temp
workspaces via `mkdtempSync` and cleans up in `afterEach`. The
`METHOD_TEST=true` environment variable mocks shell command execution
during witness capture.

## Dependencies

- `@modelcontextprotocol/sdk` — MCP server framework
- `@flyingrobots/bijou` / `@flyingrobots/bijou-node` — terminal output
- `zod` — runtime schema validation
