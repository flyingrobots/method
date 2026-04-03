# BEARING

This signpost summarizes direction. It does not create commitments or
replace backlog items, design docs, retros, or CLI status.

## Where are we going?

Current priority: pull `SYNTH_generated-signpost-provenance` and turn
generated-signpost metadata into a clearer repo contract.

## What just shipped?

`0005-drift-detector` - the CLI now checks active-cycle playback
questions against committed test descriptions before closeout.

## What feels wrong?

- `method drift` is intentionally narrow: active cycles only, exact
  normalized test-description matching, and no witness/signpost drift
  yet.
- `docs/VISION.md` is still manual dogfood, and generated-file markers
  plus regeneration guidance are not part of the contract yet.
