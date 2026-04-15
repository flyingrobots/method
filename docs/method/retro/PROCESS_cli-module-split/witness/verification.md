---
title: "Verification Witness"
---

Date: 2026-04-03

## Commands

```text
$ find src -maxdepth 1 -type f | sort
src/cli-args.ts
src/cli.ts
src/drift.ts
src/errors.ts
src/workspace.ts

$ wc -l src/cli.ts src/cli-args.ts src/workspace.ts src/drift.ts src/errors.ts
      97 src/cli.ts
     208 src/cli-args.ts
     512 src/workspace.ts
     289 src/drift.ts
       6 src/errors.ts
    1112 total

$ rg -n "export async function runCli|class Workspace|detectWorkspaceDrift|parseCliArgs|usage\\(|renderStatus\\(|detectDrift\\(" src/cli.ts src/cli-args.ts src/workspace.ts src/drift.ts
src/cli-args.ts:14:export function parseCliArgs(argv: readonly string[]): ParsedCommand {
src/cli-args.ts:52:export function usage(topic?: string): string {
src/workspace.ts:13:import { detectWorkspaceDrift, type DriftReport } from './drift.js';
src/workspace.ts:70:export class Workspace {
src/workspace.ts:185:  detectDrift(cycleName?: string): DriftReport {
src/workspace.ts:187:    return detectWorkspaceDrift(this.root, cycles);
src/workspace.ts:190:  renderStatus(ctx: ReturnType<typeof createNodeContext>): string {
src/cli.ts:7:import { parseCliArgs, usage } from './cli-args.js';
src/cli.ts:20:export async function runCli(
src/cli.ts:32:    const parsed = parseCliArgs(argv);
src/cli.ts:34:      stdout.write(`${usage(parsed.topic)}\n`);
src/cli.ts:75:      const report = workspace.detectDrift(parsed.cycle);
src/cli.ts:80:    stdout.write(workspace.renderStatus(ctx));
src/drift.ts:17:export function detectWorkspaceDrift(root: string, cycles: readonly Cycle[]): DriftReport {

$ npm test

> method@0.1.0 test
> vitest run --config vitest.config.ts

 RUN  v4.1.2 <REPO_ROOT>

 Test Files  2 passed (2)
      Tests  37 passed (37)

$ npm run build

> method@0.1.0 build
> tsc -p tsconfig.json

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  <REPO_ROOT>

--- Backlog ---
inbox       1  PROCESS_release-shaping-and-user-migration-docs
asap        1  SYNTH_generated-signpost-provenance
up-next     5  PROCESS_behavior-spike-convention, PROCESS_git-branch-workflow-policy, PROCESS_library-api-surface, PROCESS_system-style-javascript-adoption, SYNTH_executive-summary-protocol
cool-ideas  6  PROCESS_drift-near-miss-hints, PROCESS_legend-audit-and-assignment, PROCESS_retro-conversational-closeout, PROCESS_review-config-hardening, SYNTH_artifact-history-and-semantic-provenance, SYNTH_cycle-witness-command
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
PROCESS  backlog=9 active=0
SYNTH    backlog=4 active=0
```

## Interpretation

- The CLI no longer lives in a single source file; the committed `src/`
  layout exposes the new boundaries directly.
- `src/cli.ts` is now a thin entry point, while `Workspace` and the
  drift matcher live in their own runtime-owned modules.
- `Workspace` still owns internal document scaffolding and markdown
  traversal in this first cut; the split only moved parsing and
  drift-specific behavior into dedicated modules.
- The build, tests, and workspace status commands still pass after the
  split, so the refactor preserved the existing CLI contract.
- Backlog maintenance was completed during closeout, including moving
  `PROCESS_retro-conversational-closeout` out of `inbox/`.
- The branch tip also includes the later backlog capture
  `PROCESS_release-shaping-and-user-migration-docs`, which is why the
  current status output shows `inbox 1`.
