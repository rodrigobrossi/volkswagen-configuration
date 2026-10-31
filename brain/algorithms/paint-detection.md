---
id: ALG-paint-detection
type: algorithm
title: Paint detection and recolouring
status: active
tags: [paint]
links: [L-0005, L-0011, CON-option-group]
code: [src/core/geometry/materials.ts, src/render/systems/useBodyPaint.ts]
updated: 2026-09-29
---

# Paint

**Which meshes are paint:** `paint.materials` when declared (paint split across several materials —
1968 `Paint_new` + `Body`), else the **volume vote**: the opaque, non-glass material with the largest
summed mesh-bbox volume (near-black allowed — paint can be black).

**Recolour:** clone the material ONCE, share the clone across every paint mesh (a clone per mesh
breaks later lookups), drop `map` for textured paint ([L-0005](../learnings/L-0005-textured-paint.md)),
set `hex` + `FINISH_PROPS[finish]`. The cached original is never touched.

**Engine-bay tint** uses the asset's ORIGINAL colour (`findBodyColor`, skips near-black, samples
texture averages) — deliberately not the selected paint.

Everything that shows body metal elsewhere (cabin floor, donor interior panels) follows the SELECTED
paint ([L-0011](../learnings/L-0011-interior-paint-bleed.md)).
