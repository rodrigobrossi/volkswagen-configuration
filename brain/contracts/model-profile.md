---
id: CON-model-profile
type: contract
title: ModelProfile — the essence of one asset
status: active
tags: [contract, profile, data]
links: [CON-extraction-strategy, ONT-overview, ADR-0002, AGT-ingestion, AGT-verifier]
code: [src/core/contracts/profile.ts, src/core/contracts/validate.ts, src/vehicles/vw-type1/models]
updated: 2026-09-29
---

# ModelProfile (`vehicle-profile/v1`)

Everything the software knows about ONE 3D asset, as **JSON data**
([schema](model-profile.schema.json), types in [`profile.ts`](../../src/core/contracts/profile.ts)).
Lives in `src/vehicles/<family>/models/<name>.profile.json`; every file there is registered
automatically (Vite glob) and validated at load (`validateProfile`) and offline (`brain:check`).

| Field | Meaning |
|---|---|
| `id` | stable id — also the persistence key of user overrides; **never rename casually** |
| `family` | owning [family](vehicle-family.md) (must equal the folder) |
| `asset` | `path` under `public/`, optional `rootNode` (files bundling several objects), `credit` |
| `frame` | `scale` (asset units → metres), `rotationY` (heading) — centering/grounding are automatic |
| `parts.groupBy` | parts-editor grouping: `node` or `material` names, whichever the asset authored legibly |
| `paint` | explicit paint `materials` (else auto) and `recolorable` |
| `openables[]` | bindings: `group` (open group) + [`extract`](extraction-strategy.md) + `articulation` + `companions` + `note` |
| `wheels.mounts[]` | baked wheel `node`s to hide/measure, `splitX` when one node holds an axle |
| `interior.source` | `own` baked cabin, or `donor` (the family cabin is fitted; `donorScale`, `flipZ`) |
| `cabinFloor` | metres, vehicle frame — caps a hollow cabin ([cabin floor](../algorithms/cabin-floor.md)) |
| `engineBay.hideNodes` | inner shells hidden while the engine lid is open |
| `platform.enabled` | the family platform can replace the body |
| `provenance` | `status` (`draft`/`verified`), `notes` (the model's brain note), `confidence` |

## Invariants
- `models/` holds only **verified** profiles; drafts go to `drafts/` and are never loaded.
- Every binding's rationale lives in the model note named by `provenance.notes`, not in the JSON.
- Region fractions are in the **build frame** of their reference mesh; metric fields are in the
  **vehicle frame** ([frames](../ontology/vehicle-frame.md)).
