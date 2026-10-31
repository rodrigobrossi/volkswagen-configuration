---
id: ALG-capture-companions
type: algorithm
title: Companions — what must ride a hinge with its panel
status: active
tags: [extraction, articulation]
links: [ALG-articulate-hinge, MOD-beetle-1303-1980]
code: [src/core/pipeline/articulate.ts]
updated: 2026-09-29
---

# Companions

Assets are often organised by **material**, so a door's handle, mirror and seal are separate meshes
that would stay behind when only the panel swings ("os frisos e maçanetas permanecem no lugar").
- `attachNearest`: whole **per-side** meshes, re-parented to the nearest hinge by X. Never tears
  anything — only list complete per-side parts.
- `splitByFootprint`: a **shared** mesh (door glass fused with the quarter glass; a belt trim running
  through both doors and the fenders) is triangle-split by EACH panel's footprint (X widened by
  0.35× depth to reach proud trim, Y grown for the window). Only for glass/trim — never paint.

Both are snapshotted **before** hinging.
