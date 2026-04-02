# README Revision

Source backlog item: `docs/method/backlog/asap/readme-revision.md`
Legend: none

## Sponsors

- Human: I can read the README once and understand METHOD's stances,
  constraints, coordination model, and closeout rules without having
  to infer hidden process from chat history.
- Agent: I can rely on the README as truthful repo doctrine. Its
  claims about active work, witness requirements, and coordination map
  to actual files and commands instead of aspirational prose.

## Hill

The README becomes a stronger operating document: easier to scan,
clearer about human/agent disagreement and coordination, explicit about
reproducible proof, and truthful about what exists in the repo today.

## Playback Questions

### Human

- [ ] Can I scan the revised README and understand METHOD's stances,
      design constraints, quality gates, and coordination posture more
      quickly than before?
- [ ] Does the README explain disagreement and direction-setting
      without introducing process theater or hidden ceremony?

### Agent

- [ ] Can I use the README to infer what is committed, what counts as
      done, and how active work is discovered without hitting false or
      ambiguous claims?
- [ ] Do the README's coordination and witness rules stay grounded in
      files and commands that actually exist in the repo?

## Accessibility and Assistive Reading

- The README must remain legible in plain linear Markdown. Headings and
  prose should carry the meaning; tables may help scanning but cannot
  be the only way the structure makes sense.
- New coordination or playback rules should be stated plainly in text,
  not only implied by formatting or visual grouping.

## Localization and Directionality

- Headings and definitions should stay short and literal so the
  doctrine can be localized later without heavy restructuring.
- Coordination language should avoid layout-bound metaphors. When the
  README talks about direction, it should mean repo-visible direction,
  not physical page placement.

## Agent Inspectability and Explainability

- The README must only promise surfaces agents can actually inspect:
  files, directories, and commands already present in the repo.
- If the README introduces a signpost such as `docs/BEARING.md`, that
  file must exist and its role must be bounded so it does not become
  shadow backlog truth.

## Non-goals

- [ ] Reworking the core METHOD loop or backlog lanes.
- [ ] Implementing the `drift-detector` backlog item in this cycle.
- [ ] Adding meetings, roles, or synchronization ceremony.
- [ ] Turning README prose into a second planning system that competes
      with the backlog, design docs, retros, or CLI status.

## Decisions To Make

- Accept the stronger README structure:
  `Stances`, `Design constraints`, and `Quality gates`.
- Keep reproducibility as a first-class doctrine and make sure the
  revised copy says explicitly that non-reproducible claims are not
  done.
- Add `Coordination` only if its claims stay repo-truthful.
- Introduce `docs/BEARING.md` only if it is bounded as a signpost and
  not a commitment source.
- Correct any misleading operational claims, especially around how to
  discover active cycles.

## Backlog Context

Revise the METHOD README to adopt the stronger structure and coordination language, but preserve the reproducibility doctrine and resolve any contradictions cleanly.
