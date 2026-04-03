# YAML frontmatter schema for METHOD documents

METHOD increasingly uses YAML frontmatter for generated signposts and
release-oriented artifacts, but the repo does not yet define a coherent
schema strategy across document types. We need a repo-level decision
about when frontmatter is required, what keys are shared, what keys are
document-specific, and how strict the validation should be.

Session context:

- `docs/VISION.md` already carries frontmatter with provenance-oriented
  fields such as generation time, commit grounding, and source files.
- Release shaping now introduces more artifact types under
  `docs/method/releases/` and `docs/releases/`, which creates pressure
  for a more uniform metadata contract.
- Some METHOD documents are generated, some are human-authored, and
  some are mixed. The repo currently lacks a doctrine for which of those
  classes should carry YAML frontmatter and what the minimum schema is.

Questions this should answer:

- Which METHOD document classes should support or require YAML
  frontmatter?
  - signposts
  - release packets
  - release notes
  - design docs
  - retros
  - witness artifacts
  - legend docs
  - backlog items
- What shared fields should exist across document types?
  - `title`
  - `generated_at`
  - `generated_from_commit`
  - `source_files`
  - `witness_ref`
  - `legend`
  - `cycle`
  - `version`
- Which fields are artifact-history only, and which imply stronger
  provenance claims?
- When is frontmatter required versus optional versus forbidden?
- Should the repo define one global schema, layered schemas per document
  type, or a small shared base plus per-type extensions?
- How should tests validate these schemas without making every markdown
  file noisy or ceremonial?
- How should human-authored docs and generated docs differ?

What this surfaced:

- YAML frontmatter is currently useful but ad hoc.
- The repo needs a clearer boundary between document body truth and
  document metadata truth.
- A shared schema strategy could make generated docs, release docs, and
  signposts more legible for humans and agents without turning backlog
  notes or witness transcripts into metadata sludge.
