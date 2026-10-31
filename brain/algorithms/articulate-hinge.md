---
id: ALG-articulate-hinge
type: algorithm
title: Articulate — hinge placement and outward sign
status: active
tags: [articulation]
links: [ALG-capture-companions, L-0002, ONT-overview]
code: [src/core/pipeline/articulate.ts, src/render/systems/useArticulation.ts]
updated: 2026-09-29
---

# Articulate

Per extracted panel: bbox → pivot = (centre.x, edge `pivotY`, edge `pivotZ`); a `Group` at the pivot
(`userData.isHinge`, `userData.slot`) `attach()`es the panel **while it is still parented**
([L-0002](../learnings/L-0002-attach-while-parented.md)).

## Outward sign (doors, axis y)
`sign = sign(center.z − pivot.z) · sign(center.x)` — depends on the car side AND on which side of the
hinge the panel's mass sits; `sign(x)` alone swings a front-hinged door into the cabin. `signs[]`
overrides per hinge.

## Conventions learned (all current models)
| Group | axis | openAngle | pivotY | pivotZ |
|---|---|---|---|---|
| doors (front hinge) | y | 1.0–1.3 | center | max |
| frontLid (cabin-side hinge, nose rises) | x | −1.1 | max | min |
| rearLid (cabin-side hinge, tail rises) | x | +1.1 | max | max |
Hinging at the outer tip swings the panel through a huge arc ("opening out of scope").

Runtime: `useArticulation` only sets `rotation.x|y` — no rebuild on toggle.
