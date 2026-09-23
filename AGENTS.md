# Fusca 3D Configurator — Project Context

**Owner:** Rodrigo Brossi (rbrossi)
**Product:** Web app to configure a Volkswagen Fusca (Beetle, Brazilian market) in an interactive 3D viewer
**Status:** Working prototype (placeholder geometry, core config pipeline + 360° turntable wired end-to-end)

**Full design doc:** [docs/SDD.md](docs/SDD.md) — architecture, data model, reference vehicle, known gaps.

---

## What this is

A 3D configurator where a user picks a Fusca chassis year, wheels, steering wheel,
suspension height, exterior color, interior, engine, and can apply real-world-inspired
style presets (Cal Look, Baja Bug, Rat Look/Patina, Resto Stock, Rebaixado BR street, and
"Meu Fusca" — an approximation of the owner's real reference car). Changes update a live 3D
model instantly, and the viewer auto-rotates as a 360° turntable (toggle button in the viewer).

`reference/fusca-photos/` holds real photos/video of the owner's Fusca used to ground some
data entries (color, wheels, taillight shape). It's git-ignored (contains the visible license
plate) — local reference only, never committed.

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

See [docs/SDD.md](docs/SDD.md) §6 for the full list (body mesh still primitive-geometry,
interior/steering-wheel/engine not visually modeled, mobile layout, share/export). Update
that section, not this file, when gaps are resolved or new ones are found.

## Running locally

```bash
npm install
npm run dev
```
