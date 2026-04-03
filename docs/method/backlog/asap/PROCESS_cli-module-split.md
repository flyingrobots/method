# CLI Module Split

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
