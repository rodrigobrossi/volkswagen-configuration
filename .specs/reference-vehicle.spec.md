# Reference Vehicle Spec

## Source material

`reference/fusca-photos/` — 31 photos + 1 walk-around video of the owner's real Fusca.
**Git-ignored** (visible license plate) — local-only, never committed, never referenced by path
in anything that gets published outside this machine.

## What it's grounded

| Fact | Data entry | File |
|---|---|---|
| 1970s Brazilian Fusca 1300, vertical-oval taillights | `chassisYears['square-71-85'].taillightShape = 'vertical-oval'` | `data/fusca.ts` |
| Copper/burnt-orange metallic paint | `exteriorColors['meu-fusca-cobre']` (`#b2502d`) | `data/fusca.ts` |
| Painted steel wheel, small chrome hubcap | `wheelOptions['aco-hubcap']` | `data/fusca.ts` |
| Sport "banana" steering wheel bar | `steeringWheelOptions['sport-banana']` (reused, not new) | `data/fusca.ts` |
| Rear engine-lid vent louvers | `FuscaModel.tsx` detail mesh | `components/FuscaModel.tsx` |
| Stock ride height | `suspensionOptions['stock-height']` (reused, not new) | `data/fusca.ts` |

Bundled as the `meu-fusca` style preset (see [style-presets.spec.md](style-presets.spec.md)).

## Rules

- Every data entry grounded in the photos gets a `note` saying so (e.g. "matches the reference
  car in `reference/fusca-photos`") — never silently pass off a photo-derived value as an
  official spec.
- The `meu-fusca-cobre` hex and any future sampled colors are **approximations**, explicitly
  not official VW factory color codes, unless independently verified.
- This is a starting point, not a finished likeness — the model is still primitive geometry
  (see [3d-model.spec.md](3d-model.spec.md)), so "Meu Fusca" approximates the reference car's
  color/trim/era, not its exact shape.
- If more detail is pulled from the photos/video later (interior trim pattern, engine bay
  specifics, exact wheel offset), add it to the table above in the same change.
