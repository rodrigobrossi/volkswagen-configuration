---
id: MOD-beetle-1968
type: model
title: 1968 Volkswagen Beetle — two cars in one file
status: active
tags: [model, vw-type1]
links: [VEH-vw-type1, L-0001, L-0003, L-0004, L-0005, L-0007, ALG-cabin-floor]
code: [src/vehicles/vw-type1/models/beetle-1968.profile.json]
updated: 2026-09-29
---

# 1968 Volkswagen Beetle · `model-1968` · `fusca-1968.glb`

KrStolorz, Sketchfab Standard.
- **Root:** the file bundles an old and a new car; render only `1968_Volkswagen_Beetle_(new)_38`
  (sanitized name — [L-0001](../../../learnings/L-0001-gltf-name-sanitization.md)); its original (2,0,0)
  offset must be zeroed ([L-0003](../../../learnings/L-0003-zero-root-transform.md)); licence watermark
  plate removed ([L-0004](../../../learnings/L-0004-sketchfab-watermark.md)).
- **Doors:** `DoorL_3` / `DoorR_7`, front hinge. **Lids:** `Hood_17` is the REAR engine lid (−Z),
  `Trunk_30` the FRONT trunk — names lie; both hinge at the cabin-side top edge.
- **Engine bay:** hide `Object_59` (inner shell dark on the bay side) while open.
- **Wheels:** four separate nodes; the measured AABBs (0.71–0.88) include brake/knuckle → the smallest
  wins ([L-0007](../../../learnings/L-0007-wheel-diameter-min.md)). "FL" measured on −X: sides are geometric.
- **Paint:** `Paint_new` + `Body` share the same baked texture → both listed; map dropped on recolour
  ([L-0005](../../../learnings/L-0005-textured-paint.md)).
- **Cabin floor:** interior bottoms at y≈0.40 with no floor pan → floor at y 0.38, x ±0.62, z −1.02..1.08.

**Parity probe (2026-09-24):** closed 41 meshes · 27,525 verts; open 45 · 48,594; hinges (verts)
door L 1915, rear lid 1035, front lid 1387, door R 1915 — boxes recorded in the refactor baseline.
