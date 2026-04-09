---
title: "Retro Scaffold Refresh Command"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: low
acceptance_criteria:
  - "The command accepts explicit cycle IDs and glob selectors plus a dry-run mode."
  - "Refresh updates only scaffold-owned frontmatter and generated placeholders while preserving human-authored retro sections and witness files."
  - "The command reports deterministic diff and exit-code behavior for success, empty matches, invalid selectors, and write failures."
---

# Retro Scaffold Refresh Command

When scaffold contracts change, already-generated retro and witness
artifacts currently need manual repair. A narrow refresh command could
re-render committed cycle packet scaffolds in place while preserving the
human-written sections that should not be regenerated.

That would turn scaffold contract upgrades from one-off cleanup work
into a repeatable maintenance move.

## Proposed Contract

- Command shape:
  `method refresh retro <cycle-selector...> [--dry-run]`
- Accepted inputs:
  explicit cycle ids like `0003-bearing-truthfulness`, glob selectors
  like `003[0-3]-*`, or a path list resolved to retro packet roots.
- Preserved content:
  existing body text under `## Summary`, `## Playback Witness`,
  `## Drift`, `## New Debt`, `## Cool Ideas`, and the current
  `## Backlog Maintenance` checklist state, plus everything already
  stored under each retro packet's `witness/` directory.
- Regenerated content:
  scaffold-owned frontmatter fields, missing required headings, and any
  generated placeholder blocks whose contract changed between renderer
  versions.
- Expected diff behavior:
  `--dry-run` prints which files would change and exits without writing;
  write mode updates files in place and prints the touched packet paths.
- Failure modes and exit codes:
  exit `0` when all matched packets are already current or are refreshed
  successfully; exit `1` when no packets match; exit `2` for invalid
  selectors or malformed packet structure; exit `3` for write failures.

## Examples

- `method refresh retro 0033-bearing-truthfulness`
- `method refresh retro 003[0-3]-* --dry-run`
- `method refresh retro docs/method/retro/0032-mcp-tool-result-contract`

## PASS Criteria

- [ ] Operators can refresh one packet or a bounded set of packets
      without overwriting human-written retro content.
- [ ] The command explains exactly what changed or why it refused.
