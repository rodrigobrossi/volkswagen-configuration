---
id: CON-built-vehicle
type: contract
title: BuiltVehicle — output of the build pipeline
status: active
tags: [contract, pipeline]
links: [ALG-pipeline, ALG-articulate-hinge, ALG-measure-wheels]
code: [src/core/contracts/built.ts, src/core/pipeline/build.ts]
updated: 2026-09-29
---

# BuiltVehicle

`buildVehicle(scene, profile)` returns:

| Field | Meaning |
|---|---|
| `object` | the normalized, rigged asset graph (build frame) |
| `rigs[]` | per open group: `hinges` (Groups with `userData.isHinge/slot`), `signs`, `angle`, `axis`, panel `centers`/`sizes`, `slots` |
| `wheelHubs[]` | measured hub `position` + `diameter` (build frame) |
| `centering` | build → vehicle frame offset (X/Z centred, grounded) |
| `size` | whole-vehicle bbox size (build frame) |

No file-specific names survive in it: systems read slots, groups and measurements only.
