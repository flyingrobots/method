---
title: "Method CLI"
legend: none
---

Source backlog item: `docs/method/backlog/inbox/method-cli.md`


## Sponsors

- Human: Keep METHOD usable without memorizing directory conventions.
- Agent: Expose the filesystem workflow through a stable command surface.

## Hill

A contributor can initialize a METHOD workspace, capture an idea, pull a
backlog item into a numbered cycle, inspect the current backlog state,
and close an active cycle into a retro without editing paths by hand.
The command surface should feel native to the existing Bijou/TypeScript
tooling stack rather than introducing a parallel implementation language.

## Playback Questions

### Human

- [ ] Can I move a METHOD repo forward without remembering every
      directory and naming rule?
- [ ] Can I see what is in the backlog and which cycle is still open
      from one command?

### Agent

- [ ] Can I manipulate the backlog and cycle structure through a stable
      CLI instead of reimplementing filesystem rules every turn?
- [ ] Does the CLI preserve METHOD's commitments instead of inventing a
      second source of truth outside the repository?

## Accessibility and Assistive Reading

- The CLI must preserve its meaning in plain linear terminal output and
  not require color, borders, or spatial inference to understand lane
  counts, active cycles, errors, or next steps.
- Bijou styling may improve scanning, but `status`, success messages,
  and errors should remain truthful in pipe or accessible runs.

## Localization and Directionality

- Initial implementation may ship English copy, but command text should
  stay short, literal, and easy to localize later without reworking the
  command contract.
- The CLI should avoid unnecessary left/right assumptions so a future
  richer surface can think in logical grouping and direction rather than
  hardcoded physical anchors.

## Agent Inspectability and Explainability

- Command outcomes, generated file paths, and error conditions must stay
  explicit enough for agents to script without scraping decorative text.
- If agent-mediated workflow is added later, the CLI should surface what
  changed and why through concrete filesystem artifacts rather than
  hidden state or implied success.

## Non-goals

- [ ] Multi-user coordination or locking
- [ ] Automatic test-to-design drift detection
- [ ] Git automation beyond writing files in the repository

## Backlog Context

What if Method had a CLI? Filesystem operations with guardrails.

- `method init` — scaffold the directory structure
- `method inbox "raw idea"` — drop a file in inbox/
- `method pull <item>` — move from backlog, create cycle dir, committed
- `method close` — run the retro checklist, prompt for drift check
- `method status` — show backlog by lane, active cycle, legend health

Could also be an MCP server so agents interact with the backlog
programmatically. Natural fit for agent-as-peer — the agent doesn't
need to remember the directory conventions, just calls the tool.
