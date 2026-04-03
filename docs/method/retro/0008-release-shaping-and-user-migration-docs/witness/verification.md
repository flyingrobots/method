# Verification Witness

Date: 2026-04-03

## Commands

```text
$ rg -n "docs/method/releases/vX.Y.Z/release.md|docs/method/releases/vX.Y.Z/verification.md|docs/releases/vX.Y.Z.md|docs/method/backlog/<version>/|No migration required\\.|release-runbook.md" README.md docs/method/release.md docs/method/release-runbook.md docs/releases/README.md docs/method/releases/README.md
README.md:78:    release-runbook.md              sequential release pre-flight
docs/releases/README.md:5:Each release note should live at `docs/releases/vX.Y.Z.md` and answer:
docs/releases/README.md:14:If there is no upgrade work for users, say `No migration required.`
docs/method/release.md:13:- `docs/method/releases/vX.Y.Z/release.md`
docs/method/release.md:20:- `docs/method/releases/vX.Y.Z/verification.md`
docs/method/release.md:23:- `docs/releases/vX.Y.Z.md`
docs/method/release.md:34:`docs/method/backlog/<version>/` directories, and they do not move
docs/method/release.md:54:1. Shape the release in `docs/method/releases/vX.Y.Z/release.md`.
docs/method/release.md:56:3. Draft the user-facing release notes in `docs/releases/vX.Y.Z.md`.
docs/method/release.md:57:4. Run the sequential pre-flight in `docs/method/release-runbook.md`.
docs/method/release.md:63:`docs/releases/vX.Y.Z.md` should be documentation, not ledger sludge.
docs/method/release.md:73:If no migration is required, say `No migration required.` explicitly.
docs/method/release.md:78:procedure lives in `docs/method/release-runbook.md` so it can become
docs/method/release-runbook.md:4:`docs/method/releases/vX.Y.Z/release.md` and is ready for pre-flight.
docs/method/release-runbook.md:52:   `docs/method/releases/vX.Y.Z/release.md`.
docs/method/release-runbook.md:60:7. Write or refresh `docs/releases/vX.Y.Z.md`.
docs/method/release-runbook.md:100:`docs/method/releases/vX.Y.Z/verification.md`. At minimum include:

$ npm run method -- init <TMP_ROOT>
[SUCCESS] Initialized METHOD workspace at <TMP_ROOT>
- docs/method/backlog/inbox
- docs/method/backlog/asap
- docs/method/backlog/up-next
- docs/method/backlog/cool-ideas
- docs/method/backlog/bad-code
- docs/method/legends
- docs/method/graveyard
- docs/method/releases
- docs/method/retro
- docs/releases
- docs/design
- CHANGELOG.md
- docs/method/process.md
- docs/method/release.md
- docs/method/release-runbook.md
- docs/method/releases/README.md
- docs/releases/README.md

$ find <TMP_ROOT>/docs -maxdepth 3 -type f | sort
<TMP_ROOT>/docs/method/process.md
<TMP_ROOT>/docs/method/release-runbook.md
<TMP_ROOT>/docs/method/release.md
<TMP_ROOT>/docs/method/releases/README.md
<TMP_ROOT>/docs/releases/README.md

$ npm test

> method@0.1.0 test
> vitest run --config vitest.config.ts

 RUN  v4.1.2 <REPO_ROOT>

 Test Files  2 passed (2)
      Tests  41 passed (41)

$ npm run build

> method@0.1.0 build
> tsc -p tsconfig.json

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  <REPO_ROOT>

--- Backlog ---
inbox       0  -
asap        1  SYNTH_generated-signpost-provenance
up-next     5  PROCESS_behavior-spike-convention, PROCESS_git-branch-workflow-policy, PROCESS_library-api-surface, PROCESS_system-style-javascript-adoption, SYNTH_executive-summary-protocol
cool-ideas  6  PROCESS_drift-near-miss-hints, PROCESS_legend-audit-and-assignment, PROCESS_retro-conversational-closeout, PROCESS_review-config-hardening, SYNTH_artifact-history-and-semantic-provenance, SYNTH_cycle-witness-command
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
PROCESS  backlog=8 active=0
SYNTH    backlog=4 active=0
```

## Interpretation

- The repo now names three distinct release surfaces:
  internal release design, internal release verification, and
  user-facing release notes.
- The release doctrine explicitly rejects version-numbered backlog
  directories, keeping backlog topology about priority rather than
  release membership.
- Fresh METHOD workspaces now scaffold the release doctrine, runbook,
  and release-note directories by default.
- Tests, build, and status all pass after the doctrine and scaffolding
  changes, so the release-shaping work did not break the existing CLI
  contract.
