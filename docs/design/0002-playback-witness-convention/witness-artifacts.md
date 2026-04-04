---
title: "Witness Artifacts"
legend: none
---

Companion guidance for [Playback Witness Convention](./playback-witness-convention.md).

## Purpose

This note narrows the design into practical artifact choices. The goal
is not to create a compliance archive. The goal is to leave behind just
enough concrete evidence that a later human or agent can answer the
playback questions honestly.

If the core claim cannot be reproduced, the cycle is not done.

## Default Shape

```text
docs/method/retro/<cycle>/witness/
  README.md
  playback.md
  verification.md
```

That is the default witness packet. Add more only when needed.

## When To Add More

Add extra artifacts when the default packet would hide important truth:

- `status.json` or `status.jsonl` when structured output is part of the
  claim
- `tests.tap` or `tests.junit.xml` when the runner output is easier to
  inspect in a structured report
- `trace.zip` when the behavior is interactive and a textual summary
  would be too lossy
- `screenshot.png` when visual correctness itself is the thing being
  proven

These artifacts do not replace reproducible proof. They only add
context.

## What The Index Should Say

`README.md` in the witness directory should map artifact to claim in
flat, literal language:

- what the artifact is
- how it was produced
- which playback question it answers
- what a reviewer should look for

If a richer artifact is present, the index should still make the answer
legible without opening that artifact.

## Determinism And Reproducibility Bias

When two artifacts answer the same question, prefer the more
deterministic and reproducible one.

- Prefer `status.jsonl` over a screenshot of terminal output.
- Prefer a Markdown or text transcript over a prose memory of what
  happened.
- Prefer an artifact that another reviewer can rerun over one that only
  preserves a past observation.
- If an artifact is observational rather than reproducible, say so
  plainly in the witness index.
- Do not treat a screenshot, recording, or one-off manual observation as
  sufficient proof of done by itself.

## Accessibility Bias

Witnesses should not assume visual inspection as the only review path.

- Pair screenshots or traces with text explanation.
- Avoid making ANSI color the only signal in copied terminal output.
- Use plain filenames that describe purpose rather than layout.

## Agent Bias

Agent-surface proof should be cheap to capture and cheap to inspect.

- Prefer CLI commands and committed output files.
- Include exit codes when they matter.
- Keep the production mechanism visible enough that another agent or
  human can rerun it later.

## Explicitly Deferred

- automatic capture helpers
- witness generation built into `method close`
- MCP tooling for witness production
- drift analysis between design, tests, and witness artifacts

Those may become later cycles, but this design slice is only deciding
the convention.
