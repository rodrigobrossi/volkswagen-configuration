---
name: adapt-car-model
description: Tune an existing vehicle profile so every function works on a real 3D model — openable doors/hood/engine-lid (node, merged-pair split, region clip + door-card trim), companions that must swing along, wheel mounts, paint materials, interior (own/donor), cabin floor, engine bay, calibration. Use when a model's doors/lids/parts open wrong or leave pieces behind, when making a model "the base", or as the tuning step after the ingest-vehicle skill. For a brand-new asset start with ingest-vehicle.
---

# Adapt a car model (tune its profile)

Every per-model fact is **data** in `src/vehicles/<family>/models/<name>.profile.json`; the core never
names a model. You change the profile, verify on screen, and write down why. Read first:
[brain/contracts/model-profile.md](../../../brain/contracts/model-profile.md),
[brain/contracts/extraction-strategy.md](../../../brain/contracts/extraction-strategy.md),
[brain/specs/rendering.md](../../../brain/specs/rendering.md).

## Golden rules
- **Sanitized names**: GLTFLoader strips `[ ] . : /` and turns spaces into `_` — bind sanitized names
  ([L-0001](../../../brain/learnings/L-0001-gltf-name-sanitization.md)).
- **Build frame**: extraction runs in native units before centring/scaling — regions are **fractions** of
  the reference mesh bbox ([L-0008](../../../brain/learnings/L-0008-build-frame-fractions.md)); metric
  fields (cabin floor, family constants) are metres in the vehicle frame.
- **Measure, don't eyeball**: per-hinge bboxes, raycasts, density scans via `window.__scene` (DEV).
- **Fresh tab** after hook/dependency changes ([L-0009](../../../brain/learnings/L-0009-fresh-tab-after-hook-change.md),
  [L-0013](../../../brain/learnings/L-0013-vite-dep-reoptimize.md)); pane visible ([L-0014](../../../brain/learnings/L-0014-hidden-pane-canvas.md)).
- Load any model with `?model=<id>` or `window.__setModel('<id>')`.

## Recipes (profile fields)
| Need | Field | Algorithm note |
|---|---|---|
| frame size / heading | `frame.scale`, `frame.rotationY` | [vehicle frame](../../../brain/ontology/vehicle-frame.md) |
| multi-object file | `asset.rootNode` (root transform is zeroed) | [normalize](../../../brain/algorithms/normalize.md) |
| part is its own node | `openables[].extract: { kind: "node", match: [...] }` | [extract node](../../../brain/algorithms/extract-node.md) |
| both doors in one mesh | `kind: "node-split-x"` | [split merged X](../../../brain/algorithms/split-merged-x.md) |
| door fused into the shell | `kind: "region-clip"` + `mirrorX` (+ `trim` for the door card) | [region clip](../../../brain/algorithms/region-clip.md), [trim pass](../../../brain/algorithms/trim-pass.md) |
| handle/mirror/glass must follow | `companions.attachNearest` / `splitByFootprint` | [companions](../../../brain/algorithms/capture-companions.md) |
| hinge edge / direction | `articulation { axis, openAngle, pivotY, pivotZ, signs }` — doors: front vertical edge; lids: cabin-side top edge | [articulate](../../../brain/algorithms/articulate-hinge.md) |
| wheel swap | `wheels.mounts[{ node, splitX }]` (omit = keep baked wheels) | [measure wheels](../../../brain/algorithms/measure-wheels.md) |
| paint | `paint.materials`, `paint.recolorable` | [paint detection](../../../brain/algorithms/paint-detection.md) |
| hollow cabin | `interior.source: "donor"` (+ `donorScale`, `flipZ`), `cabinFloor` | [donor interior](../../../brain/algorithms/donor-interior.md), [cabin floor](../../../brain/algorithms/cabin-floor.md) |
| engine bay occluded | `engineBay.hideNodes` | [engine bay](../../../brain/algorithms/engine-bay.md) |
| editor part names | `parts.groupBy` (`node` or `material`) + tokens in `vocabulary.json` | [part discovery](../../../brain/algorithms/part-discovery.md) |
| show it for a preset/era | family `modelRules` | [model resolution](../../../brain/algorithms/model-resolution.md) |

Worked examples: [beetle-1968](../../../brain/vehicles/vw-type1/models/beetle-1968.md) (nodes),
[beetle-1303-1980](../../../brain/vehicles/vw-type1/models/beetle-1303-1980.md) (merged pair + companions),
[fusca-1973](../../../brain/vehicles/vw-type1/models/fusca-1973.md) (region clip + door card).

## Offline inspection
`node .claude/skills/adapt-car-model/inspect-glb.mjs <file.glb>` — node/material names, native bbox,
suggested scale. For learned evidence use `npm run brain:ingest -- <file.glb> … --dry`.

## Close the loop
1. Checklist + parity probe ([rendering spec](../../../brain/specs/rendering.md)); record both in the model note.
2. `npm run brain:learn` (bindings changed ⇒ the library changed), `npm run brain:check`, `tsc -b`.
3. New gotcha → `L-` note; new strategy/contract field → spec + ADR first.
