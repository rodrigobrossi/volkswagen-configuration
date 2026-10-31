---
id: CON-vehicle-family
type: contract
title: VehicleFamily — a vehicle line
status: active
tags: [contract, family, multi-vehicle]
links: [CON-option-group, CON-model-profile, ALG-model-resolution, ADR-0004, VEH-vw-type1]
code: [src/core/contracts/family.ts, src/vehicles/index.ts, src/core/registry.ts]
updated: 2026-09-29
---

# VehicleFamily

Everything shared by the models of one vehicle line. Adding a new vehicle line = a new folder
`src/vehicles/<id>/` with a `family.ts`, its catalog, its profiles, and one `registerFamily` line in
[`vehicles/index.ts`](../../src/vehicles/index.ts). **No core or render code changes.**

| Field | Meaning |
|---|---|
| `optionGroups` | the catalog — [option groups](option-group.md) with roles |
| `presets`, `defaultPresetId` | curated selections |
| `modelRules` | `byPreset` + `byOption` → which profile renders ([resolution](../algorithms/model-resolution.md)) |
| `models` | its profiles (glob-registered) |
| `openGroupLabels` | what each open group is called (front lid = "Porta-malas" on a Beetle) |
| `engine` | engine asset + real-world constants + `accessGroup` ([engine bay](../algorithms/engine-bay.md)) |
| `donorInterior` | cabin fitted into exterior-only assets ([donor interior](../algorithms/donor-interior.md)) |
| `platform` | procedural chassis parts ([platform](../algorithms/platform.md)) |
| `wheels` | swappable wheel assets + option → asset map |
| `proceduralRenderer` | fallback renderer id when no model resolves |
