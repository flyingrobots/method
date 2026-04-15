---
title: "Doctor Command"
legend: "PROCESS"
cycle: "PROCESS_doctor-command"
source_backlog: "docs/method/backlog/inbox/PROCESS_doctor-command.md"
---

# Doctor Command

Source backlog item: `docs/method/backlog/inbox/PROCESS_doctor-command.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

Land a bounded `doctor` surface that inspects METHOD workspace health
without requiring a fully healthy `Workspace` instance, reports concrete
problems with suggested fixes, and is callable from both the CLI and
MCP.

## Playback Questions

### Human

- [ ] Does `method doctor --json` return a bounded workspace health
      report without throwing on malformed `.method.json`?
- [ ] Does `method doctor` surface missing required paths and malformed
      frontmatter with fix suggestions?

### Agent

- [ ] Does `method_doctor` return the same doctor report contract under
      `structuredContent.result`?
- [ ] Does `runDoctor()` report orphaned backlog items and git-hook
      diagnostics without requiring a healthy `Workspace` instance?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: the text output must be a
  short check list plus issue list, so operators can read it top to
  bottom without reconstructing hidden state.
- Non-visual or alternate-reading expectations: each issue must carry a
  direct fix suggestion instead of relying on color or layout cues.

## Localization and Directionality

- Locale / wording / formatting assumptions: command output remains
  ASCII-first and stable for script consumption; file paths stay repo-
  relative where possible.
- Logical direction / layout assumptions: no UI layout work is in scope;
  this cycle is about deterministic text output and structured results.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the check names,
  issue severities, and suggested fixes must be stable enough for MCP
  callers to branch on.
- What must be attributable, evidenced, or governed: each reported issue
  must identify the path or subsystem being diagnosed so agents can act
  without guessing.

## Non-goals

- [ ] Building the broader `method validate` command family in this
      cycle.
- [ ] Auto-repairing broken workspaces; `doctor` diagnoses and suggests,
      but does not mutate.
- [ ] Enforcing repo-level legend coverage rules beyond bounded orphaned
      backlog detection.

## Backlog Context

Add a method doctor command that checks workspace health: required
directories and core files exist, METHOD packet frontmatter is present
and parseable, `.method.json` parses cleanly, git hooks are configured,
and backlog cards have not escaped the recognized lane structure.

This should stay bounded. It is not the future `validate` family, and
it should not require a healthy `Workspace` object before it can tell
you why the workspace is unhealthy.
