---
id: SPEC-rendering
type: spec
title: Rendering a real model — requirements, verifier checklist, parity probe
status: active
tags: [spec, render, verification, parity]
links: [ALG-pipeline, CON-built-vehicle, ALG-model-resolution, AGT-verifier, ADR-0006, SPEC-scene-viewer, ONT-vehicle-frame]
code: [src/render/VehicleView.tsx, src/render/RealVehicle.tsx, src/render/systems/useArticulation.ts, src/render/systems/useBodyPaint.ts, src/render/systems/useNodeVisibility.ts, src/render/provisions/RealWheel.tsx]
updated: 2026-11-13
---

# Rendering a real model

## Requirements
- **R1 — resolution.** The vehicle shown is `resolveModel(family, config)`
  ([model resolution](../algorithms/model-resolution.md)); no model ⇒ the family's procedural renderer
  ([SPEC-procedural-renderer](procedural-renderer.md)). A real model mounts keyed by `profile.id`: a
  rigged graph is never reused across models.
- **R2 — frame.** The car sits in the [vehicle frame](../ontology/vehicle-frame.md): metres, +Z forward,
  +X right, wheels on y = 0, centred on X/Z, real-world length (Type 1 ≈ 4.07 m). Only `frame.scale`
  and `frame.rotationY` are authored; centring/grounding are measured.
- **R3 — build once.** `buildVehicle(scene, profile)` runs once per asset/profile; systems and
  provisions act on the `BuiltVehicle`. The cached GLTF is never mutated (clone, then edit).
- **R4 — open groups.** Every binding of an open group opens **outward** around the declared edge
  (doors: front vertical edge; lids: cabin-side top edge, tip up); companions (handle, mirror, glass,
  trim) move with it; nothing is torn; the closed state is seamless.
- **R5 — paint.** Only the profile's paint materials (explicit or dominant) recolour, through ONE
  shared clone, `map` dropped, finish from `FINISH_PROPS`; `recolorable: false` opts out.
- **R6 — wheels.** Declared baked mounts are hidden and the family wheel asset is placed on each
  measured hub, all four at one diameter (the minimum measured), mirrored by the hub's measured X
  sign, tinted by `rimColor` where untextured.
- **R7 — interior.** `own` keeps the baked cabin; `donor` fits the family donor cabin by bbox
  fractions, retinted to the selected paint.
- **R8 — engine.** While the family's engine access group is open on a model that rigs it: engine
  block + body-coloured bay; `engineBay.hideNodes` hidden; restored when closed.
- **R9 — cabin floor / platform / extra parts.** As declared by the profile and family; the chassis
  view hides the body and shows the platform.

## Verifier checklist
1. Fresh tab (`?model=<id>`), visible pane; size, grounding and heading correct.
2. Each open group: opens outward, right edge, nothing left behind or riding along (seat, sill,
   pillar), closed state seamless — check both sides and from inside.
3. Wheels on their hubs, same size, outward-facing.
4. Paint recolours the body only; interior inside the glass; no black voids with doors/lids open.
5. No console errors; `tsc -b` and `brain:check` clean.
6. Record the parity probe in the model note.

## Parity probe
With the DEV hooks ([SPEC-scene-viewer](scene-viewer.md)), for the closed and the all-open state record:
visible mesh count, total vertex count, and per hinge (`userData.isHinge`, named `hinge:<slot>`) its
vertex count (and world bbox when a hinge changed); plus the paint material(s) and colour. A
pipeline/render change lands only when every untouched model reports identical numbers
([ADR-0006](../decisions/ADR-0006-parity-gate.md)). Switch models with `window.__setModel('<id>')`;
reach the procedural renderer with era `itamar-86-96`.

```js
const cnt = (m) => m.geometry?.attributes?.position?.count ?? 0
// Visible subtree only; the ContactShadows plane (PlaneGeometry + MeshBasicMaterial) is scene furniture.
let meshes = 0, verts = 0; const hinges = {}
__scene.traverseVisible((o) => {
  if (o.isMesh && !(o.geometry?.type === 'PlaneGeometry' && o.material?.type === 'MeshBasicMaterial')) { meshes++; verts += cnt(o) }
})
__scene.traverse((o) => { if (o.userData.isHinge) { let n = 0; o.traverse((m) => m.isMesh && (n += cnt(m))); hinges[o.name] = (hinges[o.name] ?? 0) + n } })
;({ meshes, verts, hinges })
```

| Baseline | closed | open | hinges (verts) |
|---|---|---|---|
| model-1968 | 41 · 27,525 | 45 · 48,594 | door L/R 1,915 · front lid 1,387 · rear lid 1,035 |
| model-1973 | 48 · 134,155 | = closed | door L 14,184 · door R 17,112 · front lid 2,788 |
| model-1948 | 16 · 463,232 | — | — |
| model-1980 | 98 · 236,105 | — | door L 14,496 · door R 19,928 · front lid 25,320 · rear lid 26,796 |
| procedural | 82 · 9,380 | 83 · 36,530 | — |
