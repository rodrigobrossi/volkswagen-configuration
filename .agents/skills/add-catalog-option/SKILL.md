---
name: add-catalog-option
description: Add a selectable option (wheel, interior, exterior color/paint, steering wheel, suspension, engine, chassis year/era) or a style preset to a vehicle family's catalog (src/vehicles/<family>/catalog.ts), following brain/specs/catalog.md. Use when asked to add/create a new wheel style, interior, color, steering wheel, engine, era or preset in the configurator.
---

# Add a catalog option

Catalog = data in `src/vehicles/<family>/catalog.ts` (Type 1: `src/vehicles/vw-type1/catalog.ts`).
The panel and systems render it automatically by **role**. Rules:
[brain/specs/catalog.md](../../../brain/specs/catalog.md) ·
presets: [brain/specs/style-presets.md](../../../brain/specs/style-presets.md) ·
owner's car: [brain/specs/reference-vehicle.md](../../../brain/specs/reference-vehicle.md).

## Steps
1. **Find the group** in `optionGroups` (Type 1: `era`, `paint`, `wheels`, `suspension`, `steering`,
   `interior`, `engine`) and its option array (`eras`, `paints`, `wheels`, …).
2. **Add the entry** with the same fields as its neighbours:
   - `id` kebab-case, unique, stable — never rename a shipped id;
   - `label` PT for real Brazilian colours/trims, EN for generic mechanics;
   - `note`: what it is + its real-world reference; photo-derived ⇒ say so.
   - Role contracts: `paint` needs `hex` + `finish`; `wheels` needs `rimColor`, `rimStyle`, `tireProfile`.
3. **New enum value?** (`finish`, `rimStyle`, `tireProfile`, `taillightShape`, `rimMaterial`) — add it to
   the type, add its branch in the procedural renderer
   ([brain/specs/procedural-renderer.md](../../../brain/specs/procedural-renderer.md)) and, for `finish`,
   to `FINISH_PROPS` in `src/core/contracts/catalog.ts`. Never let it fall through to a default.
4. **Preset?** `selections` must name a valid option for **every** group; optionally pin a model in
   `modelRules.byPreset` (`family.ts`).
5. **Era that should show a real model?** Map it in `modelRules.byOption.map`.
6. **Gate:** `node_modules/.bin/tsc -b`, `npm run brain:check`; select the option in the browser on the
   procedural renderer and on a real model (paint/wheels).
7. **Brain:** if an invariant or enum changed, update `brain/specs/catalog.md` (values table) and
   `brain/vehicles/<family>/catalog.md` in the same branch.

## Owner rules (Type 1)
"Rebaixado" is a suspension height, not a preset; "rat look" is the `patina` paint finish; the
"mexicana 8 janelas" wheel is never removed.
