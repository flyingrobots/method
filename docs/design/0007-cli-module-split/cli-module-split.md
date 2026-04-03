# CLI Module Split

Source backlog item: `docs/method/backlog/asap/PROCESS_cli-module-split.md`
Legend: PROCESS

## Sponsors

- Human: TBD
- Agent: TBD

## Hill

TBD

## Playback Questions

### Human

- [ ] TBD

### Agent

- [ ] TBD

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: TBD
- Non-visual or alternate-reading expectations: TBD

## Localization and Directionality

- Locale / wording / formatting assumptions: TBD
- Logical direction / layout assumptions: TBD

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: TBD
- What must be attributable, evidenced, or governed: TBD

## Non-goals

- [ ] TBD

## Backlog Context

`src/cli.ts` is carrying too many concerns at once: command parsing,
workspace logic, file discovery, markdown extraction, normalization,
and the drift algorithm all live together. Split the CLI into smaller
runtime-owned modules so the code shape matches the repo's own doctrine
about traceability and single responsibility.

Session context:

- The `method drift` PR shipped a useful feature, but review surfaced a
  real structural problem: the CLI entry point is becoming a monolith.
- This is not cosmetic refactoring. It affects reviewability,
  testability, and the ability to trace a feature back to a cycle
  design without spelunking a giant file.

What this surfaced:

- `cli.ts` should become a thin entry point.
- Workspace/state logic, drift behavior, filesystem discovery, and
  normalization helpers want separate homes.
- Future cycles will get harder to ship honestly if all command logic
  keeps accumulating in one file.
