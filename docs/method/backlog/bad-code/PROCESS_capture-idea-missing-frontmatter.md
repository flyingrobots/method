---
title: "captureIdea Missing Frontmatter"
legend: PROCESS
lane: bad-code
---

# captureIdea Missing Frontmatter

`captureIdea()` in `src/index.ts` creates inbox items without YAML
frontmatter. The test suite requires all docs under `docs/` to have
frontmatter. Every `method inbox` call creates a file that fails the
docs test if committed.

Fix: Write `title`, `legend` (if provided), and `lane: inbox` as
frontmatter on new items.
