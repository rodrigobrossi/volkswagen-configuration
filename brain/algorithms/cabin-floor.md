---
id: ALG-cabin-floor
type: algorithm
title: Cabin floor provision
status: active
tags: [provision, interior]
links: [ALG-paint-detection, MOD-beetle-1968]
code: [src/render/provisions/CabinFloor.tsx]
updated: 2026-09-29
---

# Cabin floor

Hollow shells have no floor pan; the baked interior stops at the seat base, so an open door shows a
black wedge ("área preta na lataria"). `cabinFloor` (metres, vehicle frame) places a thin panel just
under the interior's lowest point across the cabin footprint, in the **selected** paint colour.
Only needed on models with openable doors and no floor of their own (1968: y 0.38).
