---
id: VEH-vw-type1
type: vehicle
title: VW Type 1 — Fusca / Beetle family
status: active
tags: [vehicle, family]
links: [CON-vehicle-family, VEH-vw-type1-catalog, VEH-vw-type1-platform, MOD-fusca-1973, MOD-beetle-1968, MOD-typ11-1948, MOD-beetle-1303-1980]
code: [src/vehicles/vw-type1/family.ts]
updated: 2026-09-29
---

# VW Type 1 (Fusca / Beetle)

Rear-engined, 2-door; front lid = luggage trunk ("Porta-malas"), rear lid = engine access
("Tampa do Motor") → `engine.accessGroup = rearLid`.

## Model rules
| Trigger | Model |
|---|---|
| preset `resto-stock` | [model-1968](models/beetle-1968.md) |
| preset `meu-fusca` | [model-1973](models/fusca-1973.md) (the user's base model) |
| era `oval-59-65` | [model-1948](models/typ11-1948.md) |
| era `round-66-70` | model-1968 |
| era `square-71-85` | model-1973 |
| era `itamar-86-96` | procedural renderer ([spec](../../specs/procedural-renderer.md)) |
[model-1980](models/beetle-1303-1980.md) is registered but not mapped (reach it with `?model=model-1980`).

## Provisions
- **Donor interior:** the 1973 `SM_Interior` cabin — the user chose it as the reference cabin.
- **Engine:** `/models/engine/scene.gltf`, 0.55 m scale, floor 0.5 m, inset 0.6 m from the tail; bay
  height 0.34 m, firewall 0.56 m, floor drop 0.04 m, fit 0.94.
- **Platform:** [platform](platform.md).
- **Wheels:** only `wheel-retro.glb` has a full tyre at the right proportion, so every wheel option
  uses it (the user asked for all wheels at the BRM size). Variety returns when tyred assets exist
  ([T-0004](../../roadmap/T-0004-tyred-wheel-assets.md)). The "mexicana 8 janelas" wheel must stay in
  the catalog (user decision).

## Rules from the owner
- "Rebaixado" is a **suspension height** (later the "catraca mexicana"), not a preset/model.
- "Rat look" is a **paint finish** (patina), available for every model — not a model.
