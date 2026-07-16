# Fusca 3D Configurator — Project Context

**Owner:** Rodrigo Brossi (rbrossi)
**Product:** Web app to configure a Volkswagen Fusca (Beetle, Brazilian market) in an interactive 3D viewer
**Status:** Scaffold + working prototype (placeholder geometry, core config pipeline wired end-to-end)

---

## What this is

A 3D configurator where a user picks a Fusca chassis year, wheels, steering wheel,
suspension height, exterior color, interior, engine, and can apply real-world-inspired
style presets (Cal Look, Baja Bug, Rat Look/Patina, Resto Stock, Rebaixado BR street).
Changes update a live 3D model instantly.

## Stack

- Vite + React 19 + TypeScript
- `@react-three/fiber` + `@react-three/drei` (Three.js) for the 3D viewer
- `zustand` for configuration state

## Structure

- `src/data/fusca.ts` — curated reference data: chassis years/body styles, wheels,
  steering wheels, suspension options, exterior colors, interiors, engine options,
  and style presets. This is a **hand-curated starting reference set** inspired by
  real Fusca production history and known customization scenes — not scraped live
  data. Treat it as a baseline to refine with verified sources, not ground truth.
- `src/store/configStore.ts` — zustand store holding the active configuration and
  `applyPreset` / `set` actions.
- `src/components/FuscaModel.tsx` — the 3D car, built from primitive geometries
  (spheres/boxes/cylinders) as a placeholder body shape. Driven entirely by the
  config store: exterior color, wheel style, suspension ride height, and
  taillight shape (by chassis era) are all live-reactive.
- `src/components/Wheel.tsx` — wheel/tire mesh (rim color, tire profile).
- `src/components/Scene.tsx` — Canvas, lighting, ground, OrbitControls.
- `src/components/ConfigPanel.tsx` — the sidebar UI. Interior, steering wheel, and
  engine are currently reflected only in the spec-sheet text (not modeled in 3D
  yet — there's no interior/cutaway view or engine bay in the placeholder model).

## Known gaps / next steps

- Replace primitive-geometry placeholder body with a proper Fusca mesh (GLTF),
  ideally with swappable parts per chassis year (oval/round-tail/square-tail/Itamar
  body panels, headlight/taillight variants).
- Model an interior/cutaway or engine-bay view so interior trim, steering wheel,
  and engine choices are visually reflected, not just listed in the spec sheet.
- Verify/replace the curated color and trim reference data in `src/data/fusca.ts`
  against actual VW do Brasil production records if factual accuracy per year matters.
- Consider adding a "share build" export/snapshot and mobile-responsive layout
  (current layout is a fixed two-pane desktop layout).

## Running locally

```bash
npm install
npm run dev
```
