---
title: "DX & Architecture Assessment"
---

# Two-Phase Assessment: DX & Architecture (Audit 001)

Codebase type: **CLI Tool + MCP Server + Library** for the METHOD
development workflow.

Date: 2026-04-07

---

## 0. EXECUTIVE REPORT CARD

| Metric | Score (1-10) | Recommendation |
|--------|-------------|----------------|
| **Developer Experience (DX)** | 6 | **Best of:** Configurable workspace paths via `.method.json` — lets projects adopt METHOD without conforming to a fixed layout. |
| **Internal Quality (IQ)** | 5 | **Watch Out For:** `src/index.ts` is an 855-line God class that owns backlog operations, cycle lifecycle, witness capture, ship sync, frontmatter parsing, and file I/O — all in one class. |
| **Overall Recommendation** | **THUMBS UP (conditional)** | Functional and well-tested (127 tests), but the monolithic Workspace class and brittle string-based YAML parsing are time bombs for maintainability. |

---

## 1. DX: ERGONOMICS & INTERFACE CLARITY

### 1.1. Time-to-Value (TTV) Score: 6/10

A developer must: clone, `npm install`, `npm run build`, then
`npm run method -- init`. There is no global install path documented,
no `npx method` support, and no quickstart that gets you from zero to
first cycle in under 60 seconds.

The biggest TTV bottleneck is **the lack of a one-command quickstart**.
`method init` exists but you have to build first.

**Action Prompt (TTV Improvement):**
> Add `npx` support and a "Quick Start" section to README.md that gets
> a user from `npx method init` to `method status` in 3 commands.
> Ensure `package.json` bin entry works without a build step (use tsx
> as the runtime or ship pre-built).

### 1.2. Principle of Least Astonishment (POLA): `method sync github`

When a user runs `method sync github` with no flags, it silently
defaults to `--push`. This is a write operation with no confirmation.
A developer who just wants to check sync status accidentally pushes
local changes to GitHub.

The intuitive expectation: a bare `sync github` should either show
status or require an explicit direction flag.

**Action Prompt (Interface Refactoring):**
> Change `method sync github` with no flags to print the current sync
> status (items with/without issue IDs) instead of defaulting to push.
> Require `--push` explicitly for write operations.

### 1.3. Error Usability

When `ensureInitialized()` fails, the error is:

```
/Users/james/git/foo is not a METHOD workspace. Run `method init` first.
```

This exposes the absolute path (leaks internal structure) and doesn't
explain *what* is missing. A more actionable message would name the
specific missing file or directory.

**Action Prompt (Error Handling Fix):**
> Update `ensureInitialized()` in `src/index.ts` to report which
> specific required path is missing (e.g., "Missing docs/method/backlog
> — run `method init` to scaffold"). Avoid exposing the absolute
> workspace root in error messages.

---

## 2. DX: DOCUMENTATION & EXTENDABILITY

### 2.1. Documentation Gap: Getting Started Guide

There is no walkthrough that takes a new user from "I heard about
METHOD" to "I just closed my first cycle." The README explains the
philosophy, the GUIDE has two tips, but neither walks through the
actual workflow end-to-end.

**Action Prompt (Documentation Creation):**
> Write a `docs/GETTING-STARTED.md` that walks through: init, inbox an
> idea, pull it into a cycle, write a design doc, write failing tests,
> make them pass, close the cycle, and run ship sync. Use a concrete
> example project.

### 2.2. Customization Score: 4/10

**Strongest extension point:** `.method.json` paths configuration —
clean, well-defaulted, Zod-validated.

**Weakest extension point:** Adding a new CLI command requires editing
3 files (`cli-args.ts` for parsing, `cli.ts` for dispatch, `mcp.ts`
for MCP exposure). There is no plugin system, no command registry, and
no way to add commands without modifying source.

**Action Prompt (Extension Improvement):**
> Introduce a command registry pattern: each command is a self-contained
> module that exports its name, argument parser, help text, and handler.
> `cli.ts` and `mcp.ts` iterate the registry instead of hardcoding
> dispatch chains.

---

## 3. INTERNAL QUALITY: ARCHITECTURE & MAINTAINABILITY

### 3.1. Technical Debt Hotspot: `src/index.ts` (855 lines)

This file is the God class of the project. `Workspace` handles:
- Backlog CRUD (`captureIdea`, `pullItem`, `moveBacklogItem`)
- Cycle lifecycle (`closeCycle`, `openCycles`, `captureWitness`)
- Status reporting (`status`, `calculateLegendHealth`)
- Ship sync (`shipSync`, `updateChangelog`, `findNewShips`)
- Frontmatter parsing (`updateFrontmatter`, `readFrontmatter`)
- File rendering (`renderBearing`, `renderDesignDoc`, `renderRetroDoc`,
  `renderWitnessDoc`)
- Shell execution (`execCommand`)
- Path resolution (`resolveBacklogItem`, `resolveCycle`)

Evidence: 855 lines, 20+ methods, 8 private helpers, 6 module-level
render functions.

**Action Prompt (Debt Reduction):**
> Extract the Workspace class into focused modules:
> 1. `src/backlog.ts` — captureIdea, pullItem, moveBacklogItem,
>    resolveBacklogItem, collectBacklogItems
> 2. `src/cycle.ts` — closeCycle, openCycles, captureWitness,
>    resolveCycle, allCycles
> 3. `src/renderers.ts` — all render functions (bearing, design,
>    retro, witness)
> 4. `src/frontmatter.ts` — updateFrontmatter, readFrontmatter,
>    updateBody
> Keep Workspace as a thin facade that delegates to these modules.

### 3.2. Abstraction Violation: Frontmatter Manipulation

`updateFrontmatter()` and `readFrontmatter()` in `src/index.ts` do
manual YAML parsing with string slicing:

```typescript
if (content.startsWith('---\n')) {
  const end = content.indexOf('\n---\n', 4);
  if (end !== -1) {
    let frontmatter = content.slice(4, end);
```

This breaks on: quoted values, multi-line values, duplicate keys,
Windows line endings, trailing whitespace. The same fragile pattern
is repeated across `readBody()` and `updateBody()`.

This is business logic (cycle operations) doing I/O formatting
(YAML serialization) — a clear SoC violation.

**Action Prompt (SoC Refactoring):**
> Extract all frontmatter operations into a `src/frontmatter.ts`
> module that uses a proper YAML library (e.g., `yaml` or `js-yaml`)
> for parsing and serialization. Expose `readFrontmatter(path)`,
> `updateFrontmatter(path, updates)`, `readBody(path)`,
> `updateBody(path, newBody)`. Add tests for edge cases: quoted
> values, multi-line, Windows line endings.

### 3.3. Testability Barrier: Direct Filesystem Access

Every method in `Workspace` calls `readFileSync`, `writeFileSync`,
`existsSync`, `mkdirSync`, etc. directly. There is no filesystem
abstraction. This means:

- Tests must create real temp directories for every scenario
- No way to test filesystem error conditions (disk full, permissions)
- No way to run in a browser or worker environment
- `collectMarkdownFiles` recursively walks directories with no depth
  limit — could hang on symlink loops

**Action Prompt (Testability Improvement):**
> Define a `FileSystem` interface with the subset of operations
> Workspace needs (readFile, writeFile, exists, mkdir, readdir,
> rename, unlink). Default implementation wraps Node's `fs` module.
> Workspace constructor accepts an optional `FileSystem` parameter.
> Tests can inject a mock/in-memory implementation.

---

## 4. INTERNAL QUALITY: RISK & EFFICIENCY

### 4.1. The Critical Flaw: Shell Injection in `execCommand`

```typescript
const driftResult = await this.execCommand(
  `tsx src/cli.ts drift ${cycle.name}`
);
```

`cycle.name` comes from directory names on the filesystem (via
`readdirSync`). If an attacker creates a directory named
`0001-$(rm -rf .)`, the command is:

```
tsx src/cli.ts drift 0001-$(rm -rf .)
```

This executes `rm -rf .` via shell expansion. The `exec()` function
uses a shell by default.

**Action Prompt (Risk Mitigation):**
> Replace `exec()` with `execFile()` (no shell) or use
> `child_process.spawn` with `{ shell: false }`. Pass arguments as
> an array, not interpolated into a string. Apply the same fix to
> `currentCommitSha()`.

### 4.2. Efficiency Sink: Repeated Full-Tree Markdown Collection

`collectMarkdownFiles()` is called multiple times during a single
`status()` call — once per lane, once for legend health. Each call
walks the entire directory tree recursively with `readdirSync`.

For a workspace with hundreds of backlog items, this means 6+ full
directory traversals per status check.

**Action Prompt (Optimization):**
> Cache the markdown file list in `Workspace` (invalidated by write
> operations). Or collect all files once and partition by lane
> in-memory instead of walking each lane directory separately.

### 4.3. Dependency Health

`@modelcontextprotocol/sdk` at `^1.29.0` — this is a rapidly evolving
pre-1.0 SDK. The caret range allows up to 2.0, which for a pre-stable
package could introduce significant breaking changes.

**Action Prompt (Dependency Update):**
> Pin `@modelcontextprotocol/sdk` to an exact version or use a tilde
> range (`~1.29.0`) to limit updates to patch-level. Add `npm audit`
> to the CI workflow.

---

## 5. STRATEGIC SYNTHESIS

### 5.1. Combined Health Score: 6/10

Functional and well-tested, but the monolithic architecture and
string-based YAML parsing are real maintenance risks. The tool works
today; the question is whether it survives the next 10 cycles of
feature growth.

### 5.2. Strategic Fix

**Extract frontmatter operations to a proper YAML library.** This
simultaneously:
- Fixes the DX bug (frontmatter corruption on edge cases)
- Fixes the architecture violation (SoC)
- Reduces the Workspace class by ~80 lines
- Makes the most fragile code path robust

### 5.3. Mitigation Prompt

> Add `yaml` (or `js-yaml`) as a dependency. Create
> `src/frontmatter.ts` that exports `readFrontmatter(path)`,
> `updateFrontmatter(path, updates)`, `readBody(path)`, and
> `updateBody(path, newBody)` using proper YAML
> parse/stringify. Migrate all callers in `src/index.ts` and
> `src/adapters/github.ts`. Add tests for: quoted values, multi-line
> values, Windows line endings, empty frontmatter, missing
> frontmatter. Remove the manual string-slicing implementation.
