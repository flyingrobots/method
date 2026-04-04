---
title: "Verification Witness"
---

Date: 2026-04-03

## Commands

```text
$ sed -n '1,200p' .github/workflows/ci.yml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

$ rg -n "\\.github/workflows/ci.yml|GitHub Actions|npm ci|npm run build|npm test" README.md
README.md:417:Repo-local CI currently uses GitHub Actions as a host adapter through
README.md:418:`.github/workflows/ci.yml`. The first cut stays narrow and explicit:
README.md:421:npm ci
README.md:422:npm run build
README.md:423:npm test
README.md:426:The workflow currently runs on `ubuntu-24.04` for Node `22`.

$ npm test

> method@0.1.0 test
> vitest run --config vitest.config.ts

 RUN  v4.1.2 <REPO_ROOT>

 Test Files  2 passed (2)
      Tests  35 passed (35)

$ npm run build

> method@0.1.0 build
> tsc -p tsconfig.json

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  <REPO_ROOT>

--- Backlog ---
inbox       1  PROCESS_retro-conversational-closeout
asap        2  PROCESS_cli-module-split, SYNTH_generated-signpost-provenance
up-next     5  PROCESS_behavior-spike-convention, PROCESS_git-branch-workflow-policy, PROCESS_library-api-surface, PROCESS_system-style-javascript-adoption, SYNTH_executive-summary-protocol
cool-ideas  4  PROCESS_drift-near-miss-hints, PROCESS_legend-audit-and-assignment, PROCESS_review-config-hardening, SYNTH_artifact-history-and-semantic-provenance
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
PROCESS  backlog=9 active=0
SYNTH    backlog=3 active=0
```

## Interpretation

- The repo now ships a committed CI workflow for this host.
- The README names the workflow path, host, supported runtime, and
  exact commands it runs.
- The same build/test commands pass locally.
- The cycle is closed, and the current branch tip also includes one new
  inbox note captured after closeout.
