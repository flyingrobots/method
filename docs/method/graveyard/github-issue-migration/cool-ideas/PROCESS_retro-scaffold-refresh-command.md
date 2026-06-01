---
title: "Retro Scaffold Refresh Command"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: low
acceptance_criteria:
  - "The command accepts explicit retro packet IDs, glob selectors, and filesystem paths resolved to retro packet roots, plus --dry-run."
  - "Refresh rewrites only scaffold-managed retro frontmatter keys (`title`, `cycle`, `design_doc`, `outcome`, `drift_check`) and section bodies that are explicitly marked scaffold-managed or that match a supported placeholder signature for that heading."
  - "Human-authored section bodies and all files under witness/ remain byte-for-byte unchanged."
  - "Batch mode reports per-packet outcomes and exits 3 when any matched packet fails during write."
---

# Retro Scaffold Refresh Command

When scaffold contracts change, already-generated retro and witness
artifacts currently need manual repair. A narrow refresh command could
re-render committed retro packet scaffolds in place while preserving the
human-written sections that should not be regenerated.

That would turn scaffold contract upgrades from one-off cleanup work
into a repeatable maintenance move.

## Proposed Contract

- Command shape:
  `method refresh retro <cycle-selector...> [--dry-run]`
- Accepted inputs:
  explicit retro packet IDs like `0033-bearing-truthfulness`, glob
  selectors like `003[0-3]-*` matched against retro packet IDs, or
  filesystem paths.
- Path resolution algorithm:
  for each selector, first match an exact retro packet ID; otherwise, if
  the selector contains glob metacharacters, expand it against directory
  names directly under `docs/method/retro/`; otherwise treat it as a
  filesystem path, normalize it, and walk upward to the nearest ancestor
  directory that is a direct child of `docs/method/retro/`. Paths under
  `witness/` resolve to their containing retro packet root; paths
  outside `docs/method/retro/` or selectors that never resolve to a
  retro packet root fail with exit `2`. Deduplicate resolved packet
  roots before processing.
- Scaffold-managed frontmatter:
  only `title`, `cycle`, `design_doc`, `outcome`, and `drift_check` are
  rewritten by the refresh command. Any other frontmatter keys are
  preserved unchanged.
- Preserved content:
  any non-placeholder body text already written under `## Summary`,
  `## Playback Witness`, `## Drift`, `## New Debt`, `## Cool Ideas`,
  and `## Backlog Maintenance`, plus every file already stored under the
  retro packet's `witness/` directory.
- Placeholder detection and regenerated content:
  new scaffolds should emit
  `<!-- method:scaffold-managed section=<heading> -->` immediately
  under each placeholder-owned heading. The refresh command first
  checks for that marker; if it is absent, it normalizes surrounding
  whitespace and matches the section body against supported historical
  placeholder signatures for that heading:
  `## Summary` -> `TBD`, `TODO`, or `To be written.`;
  `## Playback Witness` -> `Add artifacts under <witnessDir> and link
  them here.` plus earlier variants that match
  `Add artifacts under <.+> and link .* here.`;
  `## Drift`, `## New Debt`, and `## Cool Ideas` -> `- None recorded.`,
  `- None.`, or `None recorded.`;
  `## Backlog Maintenance` -> the current scaffold checklist block or an
  earlier checklist variant that still contains the same scaffold action
  list. Bodies outside that marker/signature set are treated as
  human-authored and preserved unchanged. Missing required headings are
  inserted with the current scaffold placeholder text.
- Expected diff behavior:
  `--dry-run` prints `Would refresh: <retro-doc>` lines plus the exact
  frontmatter keys and headings it would touch, then exits without
  writing. Write mode prints one line per packet using `Refreshed:`,
  `Unchanged:`, or `Failed:` prefixes, followed by a summary line with
  counts.
- Failure modes and exit codes:
  exit `0` when all matched packets are already current or are refreshed
  successfully; exit `1` when no packets match the selector; exit `2`
  for invalid selectors or malformed retro packet structure before the
  write phase; exit `3` for write failures. In batch mode the command
  continues processing remaining matched packets after a write failure,
  reports aggregate success/failure counts, and the highest applicable
  exit code wins.

## Examples

### Success case

```shell
$ method refresh retro 0033-bearing-truthfulness
Refreshed: docs/method/retro/0033-bearing-truthfulness/bearing-truthfulness.md
  frontmatter: title, cycle, design_doc, outcome, drift_check
  headings: inserted none
Summary: refreshed=1 unchanged=0 failed=0
Exit 0
```

### Dry-run mode

```shell
$ method refresh retro 003[0-3]-* --dry-run
Would refresh: docs/method/retro/0030-backlog-metadata-single-source-of-truth/backlog-metadata-single-source-of-truth.md
  would update frontmatter: title, cycle
Would refresh: docs/method/retro/0031-generated-doc-scaffold-contract/generated-doc-scaffold-contract.md
  would insert headings: none
Summary: would_refresh=2 unchanged=0
Exit 0 (dry-run, no files modified)
```

### Path input resolving from a witness file

```shell
$ method refresh retro docs/method/retro/0032-mcp-tool-result-contract/witness/verification.md
Resolved packet root: docs/method/retro/0032-mcp-tool-result-contract
Refreshed: docs/method/retro/0032-mcp-tool-result-contract/mcp-tool-result-contract.md
Summary: refreshed=1 unchanged=0 failed=0
Exit 0
```

### Error case: no matches

```shell
$ method refresh retro 9999-nonexistent
Error: No retro packets match selector '9999-nonexistent'
Exit 1
```

### Error case: batch write failure

```shell
$ method refresh retro 003[2-3]-*
Refreshed: docs/method/retro/0032-mcp-tool-result-contract/mcp-tool-result-contract.md
Failed: docs/method/retro/0033-bearing-truthfulness/bearing-truthfulness.md (permission denied)
Summary: refreshed=1 unchanged=0 failed=1
Exit 3
```

## PASS Criteria

- [ ] An explicit retro packet ID refreshes only that packet and exits
      `0`.
- [ ] A glob selector expands to a deduplicated retro packet set and
      reports one outcome line per packet.
- [ ] A filesystem path under `docs/method/retro/<cycle>/...` resolves
      to the containing retro packet root; a path outside that tree
      exits `2`.
- [ ] `--dry-run` makes no file changes and prints `Would refresh:`
      output plus the exact keys/headings it would touch.
- [ ] Write mode rewrites only `title`, `cycle`, `design_doc`,
      `outcome`, and `drift_check` in frontmatter.
- [ ] Section bodies are rewritten only when they carry the
      `method:scaffold-managed` marker or match a supported placeholder
      signature for that heading.
- [ ] Human-authored section bodies and every file under `witness/`
      remain byte-for-byte unchanged.
- [ ] Missing required headings are inserted with the current scaffold
      placeholder text.
- [ ] Exit `1` is used for no-match selectors with an explicit error
      line naming the selector.
- [ ] Exit `2` is used for invalid selectors or malformed retro packet
      structure before writes begin.
- [ ] Exit `3` is used when one or more matched packets fail during
      write, while other matched packets continue processing and the
      final summary reports the failure count.
