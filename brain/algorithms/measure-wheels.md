---
id: ALG-measure-wheels
type: algorithm
title: Measure wheels and swap them
status: active
tags: [wheels]
links: [ALG-split-merged-x, L-0006, L-0007]
code: [src/core/pipeline/wheels.ts, src/render/provisions/RealWheel.tsx]
updated: 2026-09-29
---

# Measure wheels

For each `wheels.mounts[]` node: bbox of its **direct** mesh children (shallow — a nested axle must
not bleed in, [L-0006](../learnings/L-0006-nested-axle-nodes.md)) → hub centre + diameter
`(sizeY + sizeZ)/2`; `splitX` splits vertices by world X into two hubs.
One diameter for all four: the **minimum** measured ([L-0007](../learnings/L-0007-wheel-diameter-min.md)).
Baked wheels are hidden; the family wheel asset is rendered per hub, mirrored by measured side, tinted
by `rimColor` only on untextured materials. No mounts ⇒ wheels are fused ⇒ baked wheels stay.
