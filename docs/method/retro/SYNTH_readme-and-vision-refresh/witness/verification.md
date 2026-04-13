---
title: "Verification Witness"
---

Date: 2026-04-02

## Commands

```text
$ npm test

> method@0.1.0 test
> vitest run --config vitest.config.ts

 RUN  v4.1.2 <REPO_ROOT>

 Test Files  2 passed (2)
      Tests  15 passed (15)
   Start at  17:44:04
   Duration  287ms (transform 72ms, setup 0ms, import 132ms, tests 54ms, environment 0ms)

$ npm run build

> method@0.1.0 build
> tsc -p tsconfig.json

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  <REPO_ROOT>

--- Backlog ---
inbox       5  PROCESS_behavior-spike-convention, PROCESS_legend-audit-and-assignment, SYNTH_artifact-history-and-semantic-provenance, SYNTH_executive-summary-protocol, SYNTH_generated-signpost-provenance
asap        0  -
up-next     1  PROCESS_drift-detector
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
0004-readme-and-vision-refresh README And VISION Refresh

--- Legend Health ---
PROCESS  backlog=3 active=0
SYNTH    backlog=3 active=1

$ rg -n "## Signposts|`PROCESS`|`SYNTH`|docs/VISION.md|generated_at:|generated_from_commit:|witness_ref:|source_files:" README.md docs/VISION.md
README.md:87:## Signposts
README.md:96:| `docs/VISION.md` | A bounded executive synthesis grounded in repo-visible sources. |
README.md:184:A legend code (for example, `PROCESS` or `SYNTH`) prefixes backlog filenames so
README.md:190:- `PROCESS` - METHOD's own mechanics: cycle discipline, backlog
README.md:192:- `SYNTH` - repo-wide synthesis and signposts: executive summaries,
docs/VISION.md:3:generated_at: 2026-04-02T17:41:54-07:00
docs/VISION.md:5:generated_from_commit: "0e7b57a33c44500b9720502e3bb5bac7b3d58c10"
docs/VISION.md:7:witness_ref: docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md
docs/VISION.md:8:source_files:
docs/VISION.md:58:  explicit in the README and added this bounded `docs/VISION.md`
docs/VISION.md:63:- `PROCESS` for METHOD's own mechanics.
docs/VISION.md:64:- `SYNTH` for repo self-description, signposts, and provenance shape.
docs/VISION.md:69:## Signposts
docs/VISION.md:75:- `docs/VISION.md` is the bounded executive synthesis.
docs/VISION.md:88:`PROCESS` covers the mechanics of METHOD itself: cycle discipline,
docs/VISION.md:100:`SYNTH` covers how a METHOD repo understands and explains itself:

$ npm run method -- close --drift-check yes --outcome hill-met

> method@0.1.0 method
> tsx src/cli.ts close --drift-check yes --outcome hill-met

[SUCCESS] Closed 0004-readme-and-vision-refresh
docs/method/retro/0004-readme-and-vision-refresh/readme-and-vision-refresh.md

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  <REPO_ROOT>

--- Backlog ---
inbox       5  PROCESS_behavior-spike-convention, PROCESS_legend-audit-and-assignment, SYNTH_artifact-history-and-semantic-provenance, SYNTH_executive-summary-protocol, SYNTH_generated-signpost-provenance
asap        0  -
up-next     1  PROCESS_drift-detector
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
PROCESS  backlog=3 active=0
SYNTH    backlog=3 active=0
```

## Interpretation

- The README now makes the current signposts and legends explicit.
- `docs/VISION.md` now identifies the repo commit and witness that
  support its artifact-history claims, plus the source manifest behind
  the summary.
- The cycle closed cleanly, leaving `PROCESS_drift-detector` in
  `up-next`.
