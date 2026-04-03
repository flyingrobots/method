# Retro conversational closeout

METHOD's `close` flow currently handles the mechanical part of a retro:
create the retro doc, create `witness/`, and record the outcome. It
does not yet help the human sponsor actually think through the
retrospective or capture their side of the playback honestly.

Add CLI tooling for the retro stage that prompts the human user for
their input instead of dropping them into a blank markdown skeleton.
The strongest version would not just ask one-shot questions; it would
support a conversational back-and-forth with the agent so the retro can
feel like a real structured retrospective rather than form fill.

Questions this should answer:

- What parts of the retro should be prompted versus still hand-written?
- Should the CLI gather both sponsor viewpoints explicitly: human and
  agent?
- How should the tool preserve honesty instead of steering the user
  toward "hill met" boilerplate?
- What should happen when the conversation surfaces new debt, cool
  ideas, or backlog maintenance actions?
- Should the output be direct markdown, a draft witness artifact, or a
  staged review step before files are written?
- How much of this belongs in METHOD doctrine versus repo-local CLI UX?

What this surfaced:

- The current closeout flow is mechanically correct but emotionally a
  little abrupt.
- Retro quality depends too much on the operator being willing to write
  from scratch after the command has already declared the cycle closed.
- A structured human/agent exchange could make retros more honest and
  more useful without turning METHOD into meeting theater.
