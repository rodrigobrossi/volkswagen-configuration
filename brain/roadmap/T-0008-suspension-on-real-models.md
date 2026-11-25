---
id: T-0008
type: task
title: Apply suspension height (and the "catraca mexicana") to real models
status: open
tags: [task, suspension]
links: [SPEC-catalog, SPEC-style-presets, ALG-measure-wheels, CON-built-vehicle]
code: [src/render/RealVehicle.tsx]
updated: 2026-11-13
---

# T-0008 — Suspension on real models

`rideHeightMm` only moves the procedural body; real models ignore it, so Baja/slammed presets look
stock. The owner also plans a "catraca mexicana" (adjustable front beam) as a suspension option.

**Approach.** Lift/lower the body group by `rideHeightMm` while keeping wheels on their measured hubs
grounded (needs wheel mounts; fused-wheel models move as one). Model the catraca as a front-only offset.

**Acceptance.** Slammed/stock/raised visibly differ on 1968 and 1980; wheels stay on the ground.
