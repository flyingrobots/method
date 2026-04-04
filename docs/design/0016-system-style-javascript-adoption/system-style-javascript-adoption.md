---
title: "System-Style JavaScript Adoption"
legend: PROCESS
---

# System-Style JavaScript Adoption

Source backlog item: `docs/method/backlog/up-next/PROCESS_system-style-javascript-adoption.md`
Legend: PROCESS

## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Adopt the "System-Style JavaScript" standard as repo doctrine. This
includes documenting the core principles in `docs/method/process.md`
and performing an initial hardening pass on the `Workspace` domain
models to ensure runtime authority over static convenience.

## Playback Questions

### Human

- [ ] `docs/method/process.md` contains a "System-Style JavaScript"
  section defining the repo's architectural posture.
- [ ] Domain models in `src/domain.ts` use Zod (or similar) for runtime
  validation rather than relying solely on TypeScript interfaces.

### Agent

- [ ] `docs.test.ts` validates that the System-Style JS doctrine is
  documented.
- [ ] `tests/domain.test.ts` proves that domain models (e.g., `Cycle`,
  `BacklogItem`) reject invalid data at runtime.
- [ ] The codebase demonstrates browser-portability by keeping Node-specific
  imports (like `node:fs`) strictly in the adapters or workspace implementation,
  not the domain models.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Hexagonal architecture
  makes the core domain logic easier to reason about in isolation,
  reducing cognitive load for all readers.
- Non-visual or alternate-reading expectations: Stronger types and
  runtime validation help agents catch errors early and explain them
  clearly.

## Localization and Directionality

- Locale / wording / formatting assumptions: Standardized error messages
  from runtime validation.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: Boundary schemas
  must be explicit and deterministic.
- What must be attributable, evidenced, or governed: Runtime validation
  results are governed by the declared schemas.

## Non-goals

- [ ] Complete rewrite of the entire codebase (incremental adoption).
- [ ] Eliminating all Node dependencies (keeping them in the right place).

## Backlog Context

Adopt the "System-Style JavaScript" standard as repo doctrine and use
it to guide future runtime design, module boundaries, validation, and
tooling choices. The goal is not to cargo-cult a style guide; it is to
make runtime truth, boundary validation, and honest architecture
explicit in METHOD itself.

What this surfaced:

- METHOD should say how this standard applies to its own codebase.
- Adoption likely includes doctrine updates, tool choices, and review
  posture, not just a pasted standards doc.
- The repo needs an honest stance on JavaScript, TypeScript, runtime
  validation, and what "lint is law" means here.
