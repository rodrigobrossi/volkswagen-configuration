---
name: add-catalog-option
description: Add a new selectable option (wheel, interior, exterior color, steering wheel, engine, chassis year, or style preset) to the Fusca configurator's catalog in src/data/fusca.ts, keeping the data model spec and project memory in sync. Use when asked to add/create a new wheel style, interior, color, steering wheel, engine option, chassis year, or style preset for the Fusca configurator.
---

# Add Catalog Option

Adds a new entry to one of the Fusca configurator's option catalogs in `src/data/fusca.ts`,
following the conventions in [.specs/data-model.spec.md](../../../.specs/data-model.spec.md),
and keeps specs + project memory in sync. This is the standard way to extend the
configurator's options — prefer it over freestyle edits to `data/fusca.ts`.

## Steps

1. **Read the spec first**: [.specs/data-model.spec.md](../../../.specs/data-model.spec.md) for
   the type/invariants of the catalog you're adding to, and
   [.specs/3d-model.spec.md](../../../.specs/3d-model.spec.md) if the new option touches
   anything rendered in 3D (wheels, exterior colors, chassis-year taillight shape).

2. **Identify the catalog and type** in `src/data/fusca.ts`:
   - Wheel → `wheelOptions: WheelOption[]`
   - Interior → `interiorOptions: InteriorOption[]`
   - Exterior color → `exteriorColors: ExteriorColor[]`
   - Steering wheel → `steeringWheelOptions: SteeringWheelOption[]`
   - Engine → `engineOptions: EngineOption[]`
   - Chassis year → `chassisYears: ChassisYear[]`
   - Style preset → `stylePresets: StylePreset[]`

3. **Add the entry**, following the existing entries' shape exactly (same fields, same style of
   `id`/`label`/`note`). Rules from the data model spec:
   - `id`: kebab-case, unique in its catalog, stable (don't reuse or rename existing ids).
   - `label`: user-facing string, matching the language convention of neighboring entries.
   - `note`: one sentence — what it is, and the real-world reference if there is one (e.g.
     "matches `reference/fusca-photos`" — see
     [.specs/reference-vehicle.spec.md](../../../.specs/reference-vehicle.spec.md) if the ask
     references the owner's real car).
   - For a **style preset**: every `config.*Id` must resolve to a real id in its catalog —
     double check each one against the file, don't guess.

4. **New enum value?** If the option introduces a new value of an existing enum-like field
   (`finish`, `tireProfile`, `taillightShape`, `rimMaterial`, `material`), it needs a
   corresponding render branch:
   - `finish`/exterior color rendering → `FuscaModel.tsx` (material roughness/metalness/clearcoat mapping)
   - `tireProfile` → `Wheel.tsx`
   - `taillightShape` → `FuscaModel.tsx` taillight branch
   - `rimMaterial` (steering wheel), interior `material` → currently data-only / spec-sheet
     display, no 3D branch needed yet (see 3d-model.spec.md's "explicitly out of scope")
   Add the type union value in the relevant `interface`/`type` in `data/fusca.ts` too.

5. **Typecheck**: `npx tsc -b` from the project root. Fix any type errors before moving on.

6. **Verify visually**: run the dev server (`npm run dev`) and select the new option (directly,
   or via its preset) in the browser — confirm it renders as expected and doesn't crash other
   selections.

7. **Log it**: append a dated entry to
   [.Codex/memory/context.md](../../memory/context.md) (newest entries at the top) — one or two
   sentences: what was added, to which catalog, and why (what the user asked for or what
   reference it's based on). This is the project's running decision log — don't skip it, even
   for a single-entry addition.

8. **Update `.specs/` if needed**: if you added a new enum value or changed an invariant,
   update the relevant spec file's table in the same change (data-model.spec.md at minimum).

## Example

Adding a new wheel style "Chrome Reverse":

```ts
// src/data/fusca.ts — wheelOptions array
{
  id: 'chrome-reverse',
  label: 'Chrome Reverse',
  rimColor: '#e0e0e0',
  tireProfile: 'street',
  note: 'Deep-dish reverse wheel popular in the lowered street scene.',
},
```

No new enum value (`tireProfile: 'street'` already exists) → no `FuscaModel.tsx`/`Wheel.tsx`
changes needed. Typecheck, verify in browser, then log to `context.md`:

```markdown
## 2026-07-20 — Added "Chrome Reverse" wheel option

- User asked for a deep-dish reverse wheel style for the lowered street look. Added
  `wheelOptions['chrome-reverse']` in data/fusca.ts. No new tireProfile — reuses 'street'.
```
