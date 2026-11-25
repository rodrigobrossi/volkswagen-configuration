---
id: SPEC-reference-vehicle
type: spec
title: Reference vehicle — the owner's Fusca
status: active
tags: [spec, catalog, reference]
links: [SPEC-catalog, SPEC-style-presets, MOD-fusca-1973]
code: [src/vehicles/vw-type1/catalog.ts]
updated: 2026-11-13
---

# Reference vehicle

## Source material
`reference/fusca-photos/` — photos and a walk-around video of the owner's real Fusca.
**Git-ignored** (visible licence plate): local only, never committed, never published, never quoted
by path outside this machine.

## What it grounds
| Fact | Data |
|---|---|
| 1970s Brazilian Fusca 1300, vertical-oval amber-over-red taillights | era `square-71-85` (`taillightShape: vertical-oval`) |
| Copper / burnt-orange metallic paint | paint `meu-fusca-cobre` (`#b2502d`, sampled — not a VW code) |
| Painted steel wheel, small chrome hubcap | wheels `aco-hubcap` |
| Sport "banana" steering wheel | steering `sport-banana` |
| Stock ride height | suspension `stock-height` |
| Rear engine-lid vent louvers, front turn signals on the fenders | procedural renderer details |
| Body shape | the owner chose **model-1973** ([MOD-fusca-1973](../vehicles/vw-type1/models/fusca-1973.md)) as the base model |

All bundled as the `meu-fusca` preset ([SPEC-style-presets](style-presets.md)).

## Rules
- **R1.** Every photo-derived entry says so in its `note`; never pass a sampled value off as an
  official spec.
- **R2.** Sampled colours are approximations unless independently verified.
- **R3.** New details pulled from the photos (interior trim, engine bay, wheel offset) are added to
  the table above in the same change.
- **R4.** When a shape/proportion question arises, consult the photos before guessing.
