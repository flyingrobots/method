# Cycle Witness Command

Explore a `method witness` command that can package the rerunnable
proof for a cycle close: commands run, artifacts produced, playback
answers, and file references.

Session context:

- External repos using METHOD are starting to want a cleaner way to
  package what counted as the witness for a completed cycle.
- The need is broader than any one repo's local tooling. If METHOD
  thinks witness packaging is a real pattern, it belongs here instead
  of being rediscovered downstream.

What this surfaced:

- A witness command could reduce ad hoc closeout work while staying
  faithful to METHOD's requirement that done-claims be reproducible.
- The command should package evidence, not invent it. It would point to
  rerunnable proof rather than becoming a substitute for that proof.
- It may also need a refresh mode: when a branch-local follow-up change
  alters repo-visible truth after closeout, the witness packet can drift
  even if the core cycle work is still correct.
- A good witness tool should help regenerate or refresh branch-tip
  verification without pretending that later backlog captures or review
  follow-ups never happened.
- This still feels like a cool idea, not core doctrine, until METHOD
  has clearer boundaries around artifact history, closeout flow, and
  any future API surface.
