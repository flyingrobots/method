# Verification Witness

Date: 2026-04-03

## Commands

```text
$ npm test

> method@0.1.0 test
> vitest run --config vitest.config.ts

 RUN  v4.1.2 <REPO_ROOT>

 Test Files  2 passed (2)
      Tests  23 passed (23)

$ npm run build

> method@0.1.0 build
> tsc -p tsconfig.json

$ npm run method -- help drift

> method@0.1.0 method
> tsx src/cli.ts help drift

Usage: method drift [cycle]

Check active cycle playback questions against test descriptions.

$ tmpdir=$(mktemp -d)
$ mkdir -p "$tmpdir/docs/method/backlog/inbox" "$tmpdir/docs/design/0001-drift-detector" "$tmpdir/tests"
$ cat > "$tmpdir/docs/design/0001-drift-detector/drift-detector.md" <<'EOF'
# Drift Detector

Legend: PROCESS

## Playback Questions

### Human

- [ ] Can I see the missing evidence?

### Agent

- [ ] Does the detector report exact files?
EOF
$ cat > "$tmpdir/tests/drift-clean.test.ts" <<'EOF'
it('Can I see the missing evidence?', () => {});
it('Does the detector report exact files?', () => {});
EOF
$ (cd "$tmpdir" && node <REPO_ROOT>/dist/cli.js drift)
No playback-question drift found.
Scanned 1 active cycle, 2 playback questions, 2 test descriptions.
Search basis: exact normalized match in tests/**/*.test.* and tests/**/*.spec.* descriptions.

$ tmpdir=$(mktemp -d)
$ mkdir -p "$tmpdir/docs/method/backlog/inbox" "$tmpdir/docs/design/0001-drift-detector" "$tmpdir/tests"
$ cat > "$tmpdir/docs/design/0001-drift-detector/drift-detector.md" <<'EOF'
# Drift Detector

Legend: PROCESS

## Playback Questions

### Human

- [ ] Can I see a concise drift report?

### Agent

- [ ] Does a near miss still count as unmatched?
EOF
$ cat > "$tmpdir/tests/drift-near-miss.test.ts" <<'EOF'
it('Can I see a concise status report?', () => {});
it('Does a near miss still count as unmatched eventually?', () => {});
EOF
$ (cd "$tmpdir" && node <REPO_ROOT>/dist/cli.js drift)
Playback-question drift found.
Scanned 1 active cycle, 2 playback questions, 2 test descriptions.
Search basis: exact normalized match in tests/**/*.test.* and tests/**/*.spec.* descriptions.

docs/design/0001-drift-detector/drift-detector.md
- Human: Can I see a concise drift report?
  No exact normalized test description match found.
- Agent: Does a near miss still count as unmatched?
  No exact normalized test description match found.

$ echo $?
2

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  <REPO_ROOT>

--- Backlog ---
inbox       0  -
asap        1  SYNTH_generated-signpost-provenance
up-next     2  PROCESS_behavior-spike-convention, SYNTH_executive-summary-protocol
cool-ideas  2  PROCESS_legend-audit-and-assignment, SYNTH_artifact-history-and-semantic-provenance
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
PROCESS  backlog=2 active=0
SYNTH    backlog=3 active=0
```

## Interpretation

- The CLI now documents `method drift` explicitly.
- The clean case returns `0` with a concise summary.
- The drift-found case returns `2` and names the exact design file and
  unmatched questions.
- The repo is closed out cleanly: no active cycles, processed inbox,
  and a reprioritized backlog.
