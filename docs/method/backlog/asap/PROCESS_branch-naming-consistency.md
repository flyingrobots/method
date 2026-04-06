---
title: "Branch Naming Consistency"
legend: PROCESS
lane: asap
---

# Unify branch naming rules across METHOD docs

METHOD currently names cycle branches inconsistently.

Examples in the docs point in different directions:
- `docs/method/process.md` says cycle work must happen on
  `cycles/<cycle_name>`
- the same document's branch naming section says cycle branches use
  `####-slug`

That should be one rule, not two.

Why this matters:
- branch naming is part of METHOD's coordination surface
- conflicting examples create unnecessary drift across repos
- agents and humans should not have to guess which rule is canonical

Deliverable:
- choose one branch naming rule for cycle branches
- update `README.md` and `docs/method/process.md` to match
- include one clear example and remove contradictory wording
