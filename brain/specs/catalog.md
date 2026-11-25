---
id: SPEC-catalog
type: spec
title: Catalog — options, roles and the rules for adding one
status: active
tags: [spec, catalog]
links: [CON-option-group, CON-configuration, VEH-vw-type1-catalog, SPEC-style-presets, SPEC-reference-vehicle, SPEC-procedural-renderer, AGT-catalog-curator]
code: [src/core/contracts/catalog.ts, src/vehicles/vw-type1/catalog.ts, src/core/registry.ts]
updated: 2026-11-13
---

# Catalog

Every selectable option lives in its family's `catalog.ts` as an [OptionGroup](../contracts/option-group.md).
UI and systems never hard-code option lists; they look options up by **role** through the registry.

## Requirements
- **R1 — group shape.** `{ id, role, title, ui, options, fallbackIndex? }`; array order = panel order;
  `ui` ∈ `select | swatch | color`. Group ids are the keys of `Configuration.selections`.
- **R2 — role contracts.** An option in a role group satisfies the role's interface:
  `paint` → `PaintOption { hex, finish }`, `wheels` → `WheelOption { rimColor, rimStyle, tireProfile, note }`.
  Other roles (`era`, `suspension`, `steering`, `interior`, `engine`) extend `CatalogOption` per family.
- **R3 — ids.** kebab-case, unique within the group, **stable once shipped** (presets, model rules,
  saved editor overrides reference them). Never rename; add a new option and retire the old one.
- **R4 — labels.** User-facing; Portuguese when naming a real Brazilian colour/trim, English for
  generic mechanical terms (follow the neighbours).
- **R5 — notes.** One sentence: what it is and its real-world reference. Photo-derived values say so
  ([SPEC-reference-vehicle](reference-vehicle.md)). The catalog is **curated, not verified** factory data.
- **R6 — enum values need a renderer.** A new value of an enum-like field (`finish`, `rimStyle`,
  `tireProfile`, `taillightShape`, `rimMaterial`) ships with its render branch in the same change
  ([SPEC-procedural-renderer](procedural-renderer.md)); `finish` also needs a `FINISH_PROPS` entry.
  An unhandled value must never fall through to a wrong-looking default.
- **R7 — model mapping.** If an option of the `modelRules.byOption.group` (the era for vw-type1)
  should show a real model, map it in `family.ts`; otherwise the procedural renderer shows it.
- **R8 — presets.** Covered by [SPEC-style-presets](style-presets.md).

## VW Type 1 field values in use
| Group | Field | Values |
|---|---|---|
| era | `taillightShape` | `round · square · vertical-oval` |
| era | `bodyStyle` | `oval · round-tail · square-tail · itamar` |
| wheels | `rimStyle` / `tireProfile` | `hubcap · five-spoke · multi-spoke` / `street · whitewall · offroad` |
| paint | `finish` | `gloss · matte · metallic · patina` |
| steering | `rimMaterial` | `plastic · wood · sport` |
| suspension | `rideHeightMm` | relative to stock, negative = lowered |
| interior | `material` | `vinyl · fabric · bucket-sport` (not yet visually distinct) |
| engine | `displacementCc`, `parts` | spec-sheet data |

## Owner rules
- "Rebaixado" is a **suspension height**, not a preset or model.
- "Rat look" is a **paint finish** (`patina`), available on every model.
- The "mexicana 8 janelas" wheel is never removed (owner cancelled its removal — [T-0006](../roadmap/T-0006-1973-wheels-as-base.md)).

## Acceptance
`tsc -b` clean; the new option renders on the procedural renderer and on at least one real model
(paint/wheels); every preset still resolves; `brain:check` clean. Procedure: `add-catalog-option` skill.
