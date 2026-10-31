---
id: ALG-signature-features
type: algorithm
title: Signature features — describing a part independent of its file
status: active
tags: [learning]
links: [CON-part-signature, ALG-classify-knn, ONT-vehicle-frame, L-0001]
code: [tools/glb/read-glb.mjs, tools/learning/features.mjs]
updated: 2026-09-29
---

# Signature features

`read-glb.mjs` parses a GLB without three.js: sanitized names (same rule as GLTFLoader), ancestor
chain, world AABB per primitive, material opacity. `scopeMeshes` applies `rootNode` and drops watermarks
— the same view the app's normalize stage produces.

**Vehicle frame for learning:** whole bbox; longest horizontal axis = length. Each group →
`lateral`, `spanX`, `height`, `longitudinal`, `sizeY`, `sizeZ` (fractions) → weighted vector.

## Anchors — what a mesh belongs to {#anchors}
Names like `Object_44` mean nothing; the semantics are in ancestors. A mesh's **anchor** is itself or
its nearest ancestor with a meaningful name (`porte_1_Mat_0` collapses into `porte_1`). It then
**climbs** to the assembly only when the parent is
(a) the same part by name — normalized equal or prefix-related (`Door_L_0 → DoorL_3`,
`capot → CAPOT`, `Hood_lid_15 → Hood_17`) within 1.6× volume, or
(b) a pure wrapper (identical mesh set: `Wheel_BL_8 → B_wheelL_10`).
It never climbs into a node that brings another part (a knuckle, the other axle). All names met are
kept as evidence; the binding token is the top of the climb.

**Sections:** sibling instances sharing a meaningful prefix (`vSM_Hood_…_023/_024` → `vSM_Hood`)
form one candidate when every member mesh name contains the prefix.
