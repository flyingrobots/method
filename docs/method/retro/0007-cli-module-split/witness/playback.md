# Playback Witness

Date: 2026-04-03

This was a structural refactor cycle. The deliverable is a thinner CLI
entry point and clearer behavior-owned modules, with the existing
command surface preserved.

## Human Playback

### Can I open the CLI code and identify where argument parsing ends and workspace behavior begins without reading the whole command stack top to bottom?

Yes.

The boundaries are now visible from committed file names and grep-able
exports:

- `src/cli.ts` wires execution together
- `src/cli-args.ts` owns parse/help behavior
- `src/workspace.ts` owns workspace mutations and status rendering
- `src/drift.ts` owns playback-question extraction and matching

The human no longer has to scan a 1,000-line single file to answer
basic ownership questions.

### If I need to review or change only drift behavior, can I find that logic in one small module instead of tracing through unrelated `init`, `pull`, `close`, and `status` code?

Yes.

`src/drift.ts` now holds the drift-specific behavior directly, and
`Workspace.detectDrift()` delegates to it. The refactor did not hide
drift behind generic helpers or mixed command code.

## Agent Playback

### Does `src/cli.ts` stay a thin entry point that wires command parsing and execution together rather than owning most of the runtime behavior itself?

Yes.

`src/cli.ts` is now 97 lines and contains:

- the exported `runCli`
- the exported `main`
- the entry-point bootstrap

It no longer defines `Workspace`, drift extraction, or generic file
collection behavior.

### Are the resulting modules named by owned behavior, with stable tests proving that the CLI still preserves its existing contract?

Yes.

The module names describe owned behavior directly, and the existing CLI
tests still pass after the split. Two added structural tests also prove
that:

- the behavior-owned files exist
- `src/cli.ts` no longer contains the old monolith seams

## Outcome

The hill is met. The CLI is structurally clearer, the entry point is
thin again, and the command behavior stayed stable under rerunnable
test/build/status verification.
