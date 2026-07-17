# Specs

Granular, prescriptive specs for each module of the Fusca 3D Configurator. Where
[docs/SDD.md](../docs/SDD.md) is the narrative "why/how it's organized" doc, these files are
the "what must be true" checklist per module — read them before changing the corresponding
code, and update them in the same change when behavior changes.

- [data-model.spec.md](data-model.spec.md) — catalog types/invariants in `src/data/fusca.ts`
- [3d-model.spec.md](3d-model.spec.md) — `FuscaModel.tsx` / `Wheel.tsx` dimensions, required visual elements, materials
- [scene-viewer.spec.md](scene-viewer.spec.md) — `Scene.tsx` camera, lighting, 360° turntable
- [config-panel.spec.md](config-panel.spec.md) — `ConfigPanel.tsx` sections and behavior
- [style-presets.spec.md](style-presets.spec.md) — preset rules and the reference-vehicle preset
- [reference-vehicle.spec.md](reference-vehicle.spec.md) — grounding rules for `reference/fusca-photos/`

## Workflow

Adding a new catalog option (wheel, interior, color, steering wheel, engine, chassis year, or
preset)? Use the `/add-catalog-option` skill instead of editing `data/fusca.ts` freestyle — it
walks the checklist these specs define and logs the change to
[.claude/memory/context.md](../.claude/memory/context.md).
