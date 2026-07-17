# Data Model Spec — `src/data/fusca.ts`

Single source of truth for every selectable option. Components never hardcode option lists —
they import from here and look up by id.

## Types & invariants

| Type | Required fields | Invariants |
|---|---|---|
| `ChassisYear` | `id, label, yearRange, bodyStyle, taillightShape, note` | `taillightShape` ∈ `round \| square \| vertical-oval`; `FuscaModel` must have a render branch for every value in use. |
| `WheelOption` | `id, label, rimColor, rimStyle, tireProfile, note` | `rimStyle` ∈ `hubcap \| five-spoke \| multi-spoke`, `tireProfile` ∈ `street \| whitewall \| offroad`; `Wheel.tsx`'s `WheelFace` must handle every `rimStyle` value in use. |
| `SteeringWheelOption` | `id, label, rimMaterial, note` | `rimMaterial` ∈ `plastic \| wood \| sport`; `FuscaModel`'s `SteeringWheel` must handle every value in use (drives rim color + tube thickness). |
| `SuspensionOption` | `id, label, rideHeightMm, note` | `rideHeightMm` relative to stock (0), negative = lowered. `FuscaModel` converts to a body Y-offset. |
| `ExteriorColor` | `id, label, hex, finish` | `finish` ∈ `gloss \| matte \| metallic \| patina`; each must map to a distinct roughness/metalness/clearcoat tuple in `FuscaModel`. |
| `InteriorOption` | `id, label, hex, material` | `hex` drives the rendered seat color; `material` isn't yet visually distinguished (see [3d-model.spec.md](3d-model.spec.md)). |
| `EngineOption` | `id, label, displacementCc, parts` | Data-only (spec-sheet display) — no 3D engine bay. |
| `StylePreset` | `id, label, description, config` | `config` must reference a valid id in every one of the six catalogs above — a preset pointing at a missing id is a bug. |

## Rules for adding an entry

1. `id` is kebab-case, unique within its catalog, stable once shipped (presets and any saved/shared config reference it).
2. `label` is the user-facing string (Portuguese where it names a real color/trim, English for generic mechanical terms — follow existing entries' pattern).
3. `note` is one sentence: what it is and, if relevant, what real-world reference it's based on (e.g. "matches `reference/fusca-photos`").
4. If the entry introduces a **new value** of an existing enum-like field (new `finish`, new `taillightShape`, new `tireProfile`), the corresponding render logic in `FuscaModel.tsx`/`Wheel.tsx` must be updated in the same change — an unhandled enum value must never silently fall through to a default that looks wrong.
5. Prefer the `/add-catalog-option` skill over ad-hoc edits — it walks this checklist and logs the change.

## Non-goals

This file is a **hand-curated reference set**, not a verified historical database. Color hex
values and trim names are approximations unless a `note` says otherwise (e.g. "sampled from
reference photos", "not an official VW factory code"). See [reference-vehicle.spec.md](reference-vehicle.spec.md)
for the one catalog family that *is* grounded in real photos.
