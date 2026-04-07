---
title: "CI Hardening"
legend: PROCESS
lane: cool-ideas
---

# CI Hardening

The CI workflow only runs build and test. Missing:

- `npm audit` — catch dependency vulnerabilities
- Lint step (ESLint or Biome)
- `npm pack --dry-run` — verify the package is publishable
- Coverage reporting and enforcement

These are process guardrails that prevent future regressions.
