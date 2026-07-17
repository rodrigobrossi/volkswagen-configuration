# Config Panel Spec — `ConfigPanel.tsx`

## Sections (in order)

1. **Style Preset** — one button per `stylePresets` entry; clicking calls `applyPreset(id)`,
   bulk-setting every category and highlighting the active preset.
2. **Chassis Year** — a `<select>` over `chassisYears`, plus the selected entry's `note` shown as a hint.
3. **Exterior Color** — swatch row (color dot) over `exteriorColors`.
4. **Wheels** — swatch row (label) over `wheelOptions`.
5. **Suspension Height** — swatch row over `suspensionOptions`.
6. **Steering Wheel** — swatch row over `steeringWheelOptions`.
7. **Interior** — swatch row (color dot) over `interiorOptions`.
8. **Engine** — swatch row over `engineOptions`.
9. **Spec Sheet** — plain-text summary of the fields *not* visually rendered in 3D (currently:
   interior, steering wheel, engine — keep this list in sync with
   [3d-model.spec.md](3d-model.spec.md)'s "explicitly out of scope" section; when a field
   becomes 3D-rendered, remove it from the spec sheet).

## Behavior rules

- Any individual selection (not via a preset) calls `set({ field: id })`, which also clears
  `activePresetId` — a manual tweak breaks "preset match" highlighting, by design.
- New catalog entries added via `/add-catalog-option` need no panel code changes — sections
  render directly from the `data/fusca.ts` arrays.
- All controls are native `<button>`/`<select>` elements — no custom dropdown/combobox widgets.
