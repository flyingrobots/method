---
title: "Backlog Lane Materialization Contract"
legend: PROCESS
lane: bad-code
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note names the current bad behavior: METHOD's treatment of empty backlog lane directories is implicit and drifted across init, doctor, status, and repo practice."
  - "The contract states clearly which backlog lanes must always exist on disk and which empty lanes may be absent without making the repo unhealthy."
  - "The proposal requires doctor, status, and init to agree on the same lane-materialization rules instead of each inferring them independently."
  - "Regression coverage proves an empty repo clone does not get flagged as unhealthy just because an optional empty lane directory is absent."
---

# Backlog Lane Materialization Contract

METHOD currently behaves as if some backlog lane directories may be
absent when empty, but that rule is more habit than contract. `init`
creates every lane, `status` works fine when some empty lanes are
missing, and `doctor` initially flagged the repo itself as structurally
broken until its checks were loosened.

That is bad-code because the rule is not named once and shared. It is
spread across workspace scaffolding, diagnostics, signposts, and repo
convention, which makes the repo vulnerable to false positives and
contradictory tooling behavior.

## Proposed Contract

- Lane-materialization rule:
  define explicitly which lanes are required as directories and which
  lanes may be absent when empty without making the repo unhealthy.
- Shared implementation:
  move lane-materialization expectations into a single helper or
  equivalent shared contract so `init`, `doctor`, `status`, and any
  later backlog query surfaces read the same truth.
- Diagnostics:
  `doctor` must report a missing lane directory only when the contract
  says the lane is required, not just because a directory was absent at
  inspection time.
- Signpost honesty:
  generated or rendered status surfaces must say an empty lane is empty,
  not imply that a missing directory is automatically a repo failure.

## Non-goals

- Force every repo to keep all backlog lane directories checked in at
  all times.
- Reinterpret lane priority semantics in the same slice.
- Build the broader backlog query or next-work surfaces here.
