---
title: "Feedback Archive"
---

# Feedback Archive

Processed feedback documents live here.

Archive a feedback doc after its points have been triaged into durable
repo artifacts or explicitly marked as no action.

Each archived document should preserve:

- the original feedback
- a short disposition note
- links or references to any backlog items, docs updates, or other
  outputs created from it

## Archive Entry Template

Use a minimal, predictable skeleton when archiving processed feedback:

```markdown
# <Feedback Title>

- Date: YYYY-MM-DD
- Author: <person, system, or channel>
- Tags/Status: archived, no-action, converted-to-backlog, etc.

## Original Feedback

<verbatim source or a clearly marked quoted excerpt>

## Disposition

<short note describing what happened>

## Related Items / Links

- <backlog item, doc update, PR, retro, or other output>

## Optional Follow-up Actions

- [ ] <follow-on if any>
```

The goal is provenance, not cleanliness theater. Deleting processed
feedback throws away context that the repo may need later.
