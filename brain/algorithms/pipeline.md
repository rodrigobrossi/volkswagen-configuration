---
id: ALG-pipeline
type: algorithm
title: Build pipeline — profile × asset → BuiltVehicle
status: active
tags: [pipeline]
links: [ALG-normalize, CON-extraction-strategy, ALG-articulate-hinge, ALG-measure-wheels, CON-built-vehicle]
code: [src/core/pipeline/build.ts, src/render/RealVehicle.tsx]
updated: 2026-09-29
---

# Build pipeline

```
asset (GLTF, cached) ─┐
profile (JSON) ───────┴─► normalize ─► articulate(openables: extract ─► hinge ─► companions)
                                     ─► measure wheels ─► frame (centering, size) ─► BuiltVehicle
BuiltVehicle ─► systems (articulation, paint, visibility, part overrides)
             ─► provisions (engine bay, donor interior, cabin floor, wheels, platform, extra parts)
```

- Pure and deterministic ([`build.ts`](../../src/core/pipeline/build.ts)); runs once per
  asset×profile (`useMemo`), never on a toggle. Toggles only rotate existing hinges.
- The order of `openables` is the order of rigging; keep it stable (it is part of parity).
- Frame (`centering`, `size`) is measured **after** rigging with all hinges closed.
- `RealVehicle` is keyed by profile id: switching model is a fresh build, never a reuse.
