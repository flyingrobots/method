# Playback Witness Convention

Source backlog item: `docs/method/backlog/asap/playback-witness-convention.md`
Legend: none

## Sponsors

- Human: I can inspect any closed cycle quickly and see what was
  actually proven without rereading the full design or reconstructing
  the demo from memory.
- Agent: I can produce deterministic, self-contained playback evidence
  with stable filenames and low-overhead tooling, then leave it behind
  as durable repo truth for the next collaborator.

## Hill

Every closed cycle has a `docs/method/retro/<cycle>/witness/`
directory that contains a small human-readable index plus the concrete
artifacts needed to answer the cycle's playback questions. A reviewer
should be able to open the witness directory, map artifact to claim,
and decide whether the cycle earned a clear yes.

## Playback Questions

### Human

- [ ] Can I open a past cycle's witness directory and understand what
      was proven without deep repo archaeology?
- [ ] Does each witness make the playback answer legible in plain text,
      even when a richer artifact like a screenshot or trace is also
      present?

### Agent

- [ ] Can I generate witness artifacts through repo-native commands and
      files rather than hidden chat state or ad hoc manual notes?
- [ ] Do the conventions favor deterministic outputs such as command
      transcripts, exit codes, JSON, JSONL, TAP, or JUnit before
      falling back to richer artifacts?

## Accessibility and Assistive Reading

- The witness index must be readable as plain Markdown in a linear
  terminal or screen reader flow. Meaning cannot depend on color,
  layout, or side-by-side visual comparison.
- If a witness includes screenshots, video, or traces, the index must
  say in text what each artifact proves so a non-visual reviewer can
  still answer the playback question honestly.

## Localization and Directionality

- The first convention can stay English-first, but filenames and index
  wording should be short, literal, and stable so future localization
  does not require redesigning the witness structure.
- Artifact names should describe purpose rather than physical position.
  Prefer names like `playback.md` or `verification.md` over left/right
  or other direction-bound labels.

## Agent Inspectability and Explainability

- Witness capture should prefer explicit command transcripts, exit
  codes, structured output, and committed files. Agents should not need
  to prove success by referencing ephemeral conversation state.
- If a witness was produced by an agent-run command or script, the
  index should name that mechanism clearly enough that a human can
  rerun or inspect it later.

## Non-goals

- [ ] Mandatory MCP infrastructure for witness capture. CLI-first and
      repo-native capture remain the default.
- [ ] A universal framework-specific harness for every test runner,
      browser tool, or language in the first slice.
- [ ] Replacing the design doc, tests, or retro. Witnesses prove; they
      do not restate intent.
- [ ] Committing large or sensitive binary artifacts by default when a
      deterministic text artifact would answer the same question.

## Proposed Convention

### Minimum Files

Every closed cycle should aim to produce:

- `witness/README.md` — index of playback questions to artifacts
- `witness/playback.md` — the direct playback answers, including human
  and agent outcomes
- `witness/verification.md` — deterministic verification commands and
  their results

Additional artifacts are optional and only included when they prove
something the text witnesses cannot prove alone.

### Preferred Artifact Types

Prefer these in roughly this order:

1. Plain text or Markdown transcripts
2. JSON or JSONL output
3. TAP, JUnit, or other deterministic test reports
4. Screenshots, traces, or recordings when the behavior is genuinely
   visual or interactive

This keeps witness directories small, diffable, and agent-readable by
default.

### Naming

Use semantic names instead of arbitrary sequence numbers whenever the
purpose is obvious. METHOD already treats filenames as identity, so the
name should explain why the artifact exists:

- `playback.md`
- `verification.md`
- `status.jsonl`
- `trace.zip`

If multiple runs of the same kind must coexist, add a meaningful suffix
such as `playback-agent.md` or `verification-accessible.txt`.

### Index Requirements

`witness/README.md` should answer four questions:

1. What playback question does each artifact support?
2. Which command or mechanism produced it?
3. Is it deterministic or observational?
4. What should a later reviewer look for?

### CLI / MCP Posture

METHOD should stay CLI-first here. Agents already work well with
command-line transcripts, exit codes, JSON, and JSONL. An MCP wrapper
may be useful later, but the witness convention should not depend on
one existing.

## Backlog Context

A convention for storing witnesses so they're findable after the fact.

`docs/method/retro/<cycle>/witness/` containing test output, screenshots,
transcripts — whatever artifact proves the playback happened.

Maybe a small script that captures `pnpm test` output into a witness
file automatically during step 4. The witness should be committed
alongside the retro.
