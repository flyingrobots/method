---
title: "Generated Doc Scaffold Contract"
legend: PROCESS
cycle: "0031-generated-doc-scaffold-contract"
source_backlog: "docs/method/backlog/asap/PROCESS_generated-doc-scaffold-contract.md"
---

# Generated Doc Scaffold Contract

Source backlog item: `docs/method/backlog/asap/PROCESS_generated-doc-scaffold-contract.md`
Legend: PROCESS

## Sponsors

- Human: Cycle operator
- Agent: Scaffold repair agent

## Hill

`method pull` and `method close` generate design and retro docs that
already satisfy the repo's committed document contract. A fresh cycle
packet should not require manual frontmatter surgery just to survive the
docs suite or honest review.

## Playback Questions

### Human

- [ ] Does `method pull` create a design doc that already includes
      required frontmatter fields like `title`, `legend`, `cycle`, and
      `source_backlog`?
- [ ] Does `method close` create a retro doc that already includes
      required frontmatter fields like `title`, `outcome`,
      `drift_check`, and `design_doc`?

### Agent

- [ ] Can I rely on scaffolded design docs to satisfy the repo docs
      contract without manual patching?
- [ ] Can I rely on scaffolded retro docs to satisfy the repo docs
      contract without post-close repairs?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: generated docs should place
  critical metadata in YAML so readers do not need to infer validity
  from body prose or repair steps.
- Non-visual or alternate-reading expectations: the scaffold contract
  must stay explicit and machine-readable from the first lines of the
  document.

## Localization and Directionality

- Locale / wording / formatting assumptions: scaffold metadata keys stay
  stable and deterministic regardless of the prose in the body.
- Logical direction / layout assumptions: no layout-specific behavior;
  validity depends on frontmatter and predictable section structure.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: which frontmatter
  keys are emitted for design and retro docs, and that close-time output
  does not require manual cleanup before commit.
- What must be attributable, evidenced, or governed: CLI tests should
  prove scaffolded docs meet the repo contract, and the existing cycle
  docs produced before the fix should be repaired on-branch.

## Non-goals

- [ ] Redesign the substantive content of every historical design or
      retro doc.
- [ ] Solve broader signpost truth drift such as `BEARING.md` claims.
- [ ] Redesign witness capture output beyond keeping the generated docs
      commit-safe.

## Backlog Context

`method pull` and `method close` still generate design and retro
documents with older scaffold shapes that do not match the repo's
current frontmatter contract. The committed docs suite enforces YAML
frontmatter and required fields on real docs, but the command-generated
templates do not yet guarantee those same invariants.

That means METHOD can generate docs that its own repo doctrine would
reject if they were committed. The scaffolders and the tests need to be
brought back into parity so generated docs are valid by construction.
