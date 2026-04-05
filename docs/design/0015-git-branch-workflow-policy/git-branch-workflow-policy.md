---
title: "Git branch workflow policy"
legend: PROCESS
---

# Git branch workflow policy

Source backlog item: `docs/method/backlog/up-next/PROCESS_git-branch-workflow-policy.md`
Legend: PROCESS

## Sponsors

- Human: Repository Operator
- Agent: System Automator

## Hill

Define and document a forge-agnostic Git branch and workflow policy in
`docs/method/process.md`. This policy will prescribe naming
conventions, branch lifecycles, and the "Ship Sync" maneuver to ensure
agents and humans coordinate flawlessly across distributed state.

## Playback Questions

### Human

- [ ] `docs/method/process.md` contains a "Workflow" section defining
  branch naming and lifecycles.
- [ ] The policy clearly distinguishes between "Cycle Branches" and
  "Maintenance Moves."
- [ ] The "Ship Sync" maneuver is defined (updating `BEARING.md` and
  `CHANGELOG.md` on `main` after merge).

### Agent

- [ ] `docs.test.ts` validates that the workflow policy is documented in
  the process doc.
- [ ] `docs.test.ts` validates that the policy includes specific naming
  patterns (e.g., `####-slug`).

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Standardized branch names
  make the repository history easier to navigate linearly via `git log`.
- Non-visual or alternate-reading expectations: Consistent naming
  helps agents and screen readers identify the purpose of a branch
  without deep inspection.

## Localization and Directionality

- Locale / wording / formatting assumptions: Branch names use standard
  slug forms (kebab-case).

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: Branch naming
  rules must be deterministic so agents can create branches without
  guessing.
- What must be attributable, evidenced, or governed: The transition
  from branch to `main` (Ship Sync) must be governed by clear rules.

## Non-goals

- [ ] Implementing automated branch creation in the CLI (this cycle is
  about doctrine and documentation).
- [ ] Dictating specific forge features like "Draft PRs" (staying forge-agnostic).

## Backlog Context

METHOD needs branch/workflow doctrine, not just filesystem doctrine.
The policy should distinguish cycle branches, temporary operator
branches, and direct-maintenance cases.

A likely rule from recent practice: close the cycle packet on the
branch before review (design, tests, playback, retro, witness), then
do repo-level ship sync such as `BEARING.md` and `CHANGELOG.md` on
`main` after merge.
