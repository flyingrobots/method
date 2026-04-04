---
title: "Invariant: Signpost Provenance"
---

## What must remain true?

Generated signposts cite their sources and generation context. No
orphaned claims.

## Why does it matter?

A signpost that summarizes without citing sources is an assertion
you cannot verify. If you cannot trace a claim in `VISION.md` or
`BEARING.md` back to the design docs, retros, or backlog items it
drew from, the signpost is decoration, not documentation.

## How do you check?

- Generated signposts carry a source manifest listing the surfaces
  they consumed.
- Generation metadata records when and how the signpost was produced.
- Claims in signposts can be traced to committed repo artifacts.
