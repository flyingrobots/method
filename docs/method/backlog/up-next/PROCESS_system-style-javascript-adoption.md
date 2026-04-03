# System-Style JavaScript Adoption

Adopt the "System-Style JavaScript" standard as repo doctrine and use
it to guide future runtime design, module boundaries, validation, and
tooling choices. The goal is not to cargo-cult a style guide; it is to
make runtime truth, boundary validation, and honest architecture
explicit in METHOD itself.

Session context:

- A repo-level standard was proposed covering runtime truth,
  browser-first portability, hexagonal architecture, runtime-backed
  domain forms, boundary schemas, and tooling discipline.
- The `drift-detector` review highlighted exactly the kinds of tensions
  the standard is meant to sharpen: monolithic command code, weak
  enforcement surfaces, and the difference between static convenience
  and runtime authority.

What this surfaced:

- METHOD should say how this standard applies to its own codebase.
- Adoption likely includes doctrine updates, tool choices, and review
  posture, not just a pasted standards doc.
- The repo needs an honest stance on JavaScript, TypeScript, runtime
  validation, and what "lint is law" means here.
