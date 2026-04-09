---
title: "Backlog Query Surface"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines both a CLI and MCP surface for enumerating backlog items as structured data."
  - "The result schema includes repo path plus parsed frontmatter fields such as lane, legend, title, priority, and owner when present."
  - "The surface supports bounded filtering or selection by lane, legend, and priority without requiring manual filesystem grep."
  - "The proposal explicitly says higher-level features like `next-work` may build on this query surface but do not have to land in the same slice."
---

# Backlog Query Surface

Agents and humans currently have to inspect `docs/method/backlog/`
directly or fall back to shell grep whenever they want a structured
answer to simple questions like "show all `bad-code` items", "what
`up-next` items exist?", or "which items have `priority: medium`?".

That friction shows up again and again in coordination work. A native
backlog query surface would make METHOD better for both day-to-day human
triage and agent workflows that need real repo truth without re-parsing
markdown ad hoc.

## Proposed Contract

- Surface:
  ship both a CLI query such as
  `method backlog list [--lane <lane>] [--legend <legend>] [--priority <priority>] [--json]`
  and an MCP tool such as `method_backlog_query`.
- Shared output:
  CLI `--json` and MCP return the same structured result object with
  item arrays plus summary counts.
- Item shape:
  each returned item includes at minimum
  `path`, `title`, `lane`, `legend`, `priority`, `owner`, and a
  `has_acceptance_criteria` boolean when that frontmatter is present or
  absent.
- Filtering:
  the first slice should support bounded filtering by lane, legend, and
  priority. Unfiltered output should remain bounded or paged rather than
  dumping arbitrarily large result sets without control.
- Relationship to higher-level features:
  surfaces like `method next` may build on this query result, but the
  query surface should remain useful on its own as a plain inventory and
  selection primitive.

## Agent-First Rationale

- Agents need:
  deterministic structured backlog data without scraping markdown by
  hand every turn.
- Humans benefit too:
  the same command becomes a reliable triage tool for backlog grooming,
  planning, and design-pull decisions.
- Explainability:
  when higher-level recommendation features rank items, they should be
  able to cite this query surface as the source of the underlying
  backlog facts.

## Non-goals

- Auto-pull or reorder backlog items just because they match a filter.
- Replace human planning judgment with a raw listing command.
- Fold recommendation logic into the base query surface.
