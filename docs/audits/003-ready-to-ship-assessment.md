---
title: "Ready-to-Ship Assessment"
---

# Ready-to-Ship Assessment (Audit 003)

Date: 2026-04-07

---

## 1. QUALITY & MAINTAINABILITY ASSESSMENT

### 1.1. Technical Debt Score: 4/10 (Manageable)

Three most problematic patterns:

1. **God Class** — `src/index.ts` (854 lines) owns backlog ops, cycle
   lifecycle, witness capture, ship sync, frontmatter parsing, file
   rendering, status reporting, and shell execution. Every new feature
   adds more methods here.

2. **Manual YAML parsing** — `updateFrontmatter()` and
   `readFrontmatter()` use string slicing (`content.slice(4, end)`)
   instead of a YAML library. Breaks on quoted values, multi-line
   values, duplicate keys, Windows line endings.

3. **Shell string interpolation** — `execCommand()` passes commands
   through `exec()` which invokes a shell. Cycle names are
   interpolated into command strings without escaping.

### 1.2. Readability & Consistency

**Issue 1:** `src/index.ts` mixes domain logic (cycle management) with
infrastructure concerns (filesystem I/O, shell execution, YAML
parsing) in the same class. A new engineer cannot tell where to add a
new feature — everything goes in Workspace.

**Mitigation Prompt 1:**
> Extract Workspace into focused modules: `src/backlog.ts` (captureIdea,
> pullItem, moveBacklogItem), `src/cycle.ts` (closeCycle, openCycles,
> captureWitness), `src/renderers.ts` (renderBearing, renderDesignDoc,
> renderRetroDoc, renderWitnessDoc). Workspace becomes a thin facade.

**Issue 2:** `src/mcp.ts` duplicates argument handling from
`src/cli-args.ts`. The `push = args.push || (!args.push && !args.pull)`
default logic appears in both files. If the default changes, both must
be updated.

**Mitigation Prompt 2:**
> Move the push/pull default logic into a shared function in
> `src/cli-args.ts` or `src/domain.ts`. Both CLI and MCP import it.

**Issue 3:** `src/drift.ts` has a 93-line `stripComments()` state
machine (lines 250-343) with no inline documentation explaining the
state transitions. A new engineer would struggle to verify correctness
or fix bugs.

**Mitigation Prompt 3:**
> Add inline documentation to `stripComments()` explaining each state
> and its transitions. Add dedicated unit tests for: nested quotes,
> template literals with expressions, regex literals (currently not
> handled), and Unicode escapes.

### 1.3. Code Quality Violations

**Violation 1:** `updateFrontmatter()` creates regex from user-provided
keys without escaping (line 325):

```typescript
const regex = new RegExp(`^${key}:.*$`, 'mu');
```

If `key` contains regex metacharacters (e.g., `source_files`), this
works by accident. With a key like `a.b`, it matches `a` followed by
any character followed by `b`.

**Simplified Rewrite 1:** Use a YAML library, or at minimum escape
the key:

```typescript
const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(`^${escapedKey}:.*$`, 'mu');
```

**Mitigation Prompt 4:**
> Replace manual frontmatter regex with a YAML library (`yaml` package).
> Or as a minimum fix, escape regex metacharacters in
> `updateFrontmatter()` key interpolation at src/index.ts:325.

**Violation 2:** `execCommand()` (line 573-591) handles both success
and error but silently returns concatenated stdout+stderr on error,
making it impossible for callers to distinguish success from failure:

```typescript
} catch (error: any) {
  if (error.killed || error.signal === 'SIGTERM') {
    throw new MethodError(`Command timed out: ${command}`);
  }
  return (error.stdout ?? '') + (error.stderr ?? '');
}
```

**Simplified Rewrite 2:** Return a structured result:

```typescript
interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
```

**Mitigation Prompt 5:**
> Change execCommand to return `{ stdout, stderr, exitCode }` instead
> of concatenated string. Update captureWitness and all callers to
> use the structured result.

**Violation 3:** `collectMarkdownFiles()` (line 594-610) recursively
walks directories with no depth limit or symlink protection. On a repo
with a symlink loop (`a -> b -> a`), this creates infinite recursion
and crashes.

**Simplified Rewrite 3:** Add depth limit and symlink check:

```typescript
function collectMarkdownFiles(root: string, maxDepth = 10): string[] {
  if (maxDepth <= 0 || !existsSync(root)) return [];
  // ...
  if (entry.isDirectory() && !entry.isSymbolicLink()) {
    files.push(...collectMarkdownFiles(path, maxDepth - 1));
  }
```

**Mitigation Prompt 6:**
> Add a maxDepth parameter (default 10) and symlink guard to
> collectMarkdownFiles in src/index.ts. Same fix for collectFiles in
> src/drift.ts.

---

## 2. PRODUCTION READINESS & RISK ASSESSMENT

### 2.1. Top 3 Ship-Stopping Risks

**Risk 1: Shell injection in execCommand** — Severity: HIGH
File: `src/index.ts:277`

```typescript
await this.execCommand(`tsx src/cli.ts drift ${cycle.name}`);
```

`cycle.name` is derived from directory names. A malicious directory
name could inject shell commands. `exec()` uses `/bin/sh` by default.

**Mitigation Prompt 7:**
> Replace `exec()` with `execFile()` in src/index.ts execCommand().
> Pass the command and arguments as separate parameters:
> `execFile('tsx', ['src/cli.ts', 'drift', cycle.name])`. This avoids
> shell interpretation entirely.

**Risk 2: No input validation on MCP workspace parameter** —
Severity: HIGH
File: `src/mcp.ts:121-126`

The `workspace` parameter is cast from `unknown` to `string` and
passed directly to `new Workspace()`. There is no validation that it
is an absolute path, exists, or is safe. A path like `/etc/passwd`
would be accepted.

**Mitigation Prompt 8:**
> Add validation to the MCP handler: workspace must be an absolute
> path, must exist, must be a directory. Use `path.isAbsolute()` and
> `fs.statSync()` with appropriate error messages.

**Risk 3: captureIdea does not write YAML frontmatter** —
Severity: MEDIUM
File: `src/index.ts:119-127`

New inbox items are created without YAML frontmatter. The test suite
(`docs.test.ts`) requires all docs to have frontmatter. This means
every `method inbox` call creates a file that immediately fails the
test suite if committed.

**Mitigation Prompt 9:**
> Update captureIdea in src/index.ts to write YAML frontmatter
> (title, legend if provided, lane: inbox) on new inbox items.
> Update tests to verify frontmatter is present.

### 2.2. Security Posture

**Vulnerability 1: GitHub token in .method.json**
File: `src/config.ts:17-25`

The config loader reads `github_token` from a JSON file on disk. If
`.method.json` is accidentally committed (it is NOT in `.gitignore`),
the token is exposed in git history.

**Mitigation Prompt 10:**
> Add `.method.json` to the `.gitignore` template in initWorkspace().
> Add a warning to `method init` output if `.method.json` exists and
> contains github_token but is not gitignored. Consider supporting
> @git-stunts/vault for token storage instead.

**Vulnerability 2: Unvalidated GitHub API responses**
File: `src/adapters/github.ts:211-218`

```typescript
private mapIssue(data: any): GitHubIssue {
  return {
    id: data.id,
    number: data.number,
    url: data.html_url,
    state: data.state,
    labels: data.labels.map((l: any) => l.name),
  };
}
```

The `any` type means a malformed GitHub response (e.g., missing
`labels` array) crashes with an unhelpful `Cannot read properties of
undefined` error.

**Mitigation Prompt 11:**
> Add a Zod schema for GitHubIssue API responses in
> src/adapters/github.ts. Validate the response in mapIssue() before
> mapping. Return a clear error if the response doesn't match.

### 2.3. Operational Gaps

**Gap 1: No `npm audit` in CI** — Dependency vulnerabilities are not
checked on push or PR. Currently 0 vulnerabilities, but this is not
enforced.

**Gap 2: No lint or typecheck step in CI** — The workflow runs `build`
(which includes tsc) and `test`, but there is no ESLint/Biome step.
Code style issues can merge unchecked.

**Gap 3: No npm publish dry-run in CI** — The `package.json` has a
`bin` entry, but CI never verifies the package is publishable. A
broken `exports` or `files` field would only be caught at release
time.

---

## 3. FINAL RECOMMENDATIONS

### 3.1. Final Ship Recommendation: **YES, BUT...**

The tool works, is well-tested (127 tests), and has been dogfooded
extensively. The risks identified are real but not data-loss-level.
Ship v0.3.0 with the understanding that the following must be
addressed in v0.3.1 or v0.4.0.

### 3.2. Prioritized Action Plan

**Action 1 (High Urgency):** Fix shell injection in `execCommand` —
replace `exec()` with `execFile()`. This is the only risk that could
cause damage beyond the METHOD workspace.

**Action 2 (Medium Urgency):** Add `captureIdea` frontmatter writing
— every `method inbox` call currently creates test-failing files.
This is a usability bug that hits on first use.

**Action 3 (Low Urgency):** Add `npm audit` and lint to CI — these
are process guardrails that prevent future regressions, not fixes for
current bugs.
