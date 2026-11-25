---
id: T-0004
type: task
title: Source tyred wheel assets so wheel options regain variety
status: open
tags: [task, wheels, assets]
links: [VEH-vw-type1, ALG-measure-wheels, SPEC-catalog, T-0006]
code: [src/vehicles/vw-type1/family.ts]
updated: 2026-11-13
---

# T-0004 — Tyred wheel assets

Only `wheel-retro.glb` has a full tyre at the right proportion, so every wheel option renders it
(`optionAsset` is empty); options differ only by tint. Two of the three bundled wheels have no tyre.

**Approach.** Source/commission licensed tyred wheels (steel + hubcap, whitewall, EMPI 5-spoke, BRM,
off-road); record licences in `CREDITS.md`; map them in `family.wheels.optionAsset`; set
`axleRealignYaw` per asset by screenshot. Nothing is removed: the "mexicana 8 janelas" wheel stays.

**Acceptance.** Each wheel option shows its own geometry on every model with mounts, same diameter,
outward-facing on both sides.
