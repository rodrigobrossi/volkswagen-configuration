# Fusca 3D Configurator — Software Design Document

**Status:** Working prototype. Living document — update as the model/architecture evolves.

**Detailed specs:** [.specs/](../.specs/) has per-module, prescriptive specs (dimensions,
required elements, invariants) — this document is the narrative overview; `.specs/` is the
checklist to conform to when changing code. **Project history/decisions:**
[.claude/memory/context.md](../.claude/memory/context.md). **Adding a catalog option:** use the
`/add-catalog-option` skill rather than editing `data/fusca.ts` freestyle.

## 1. Overview & Goals

A web app to configure a Volkswagen Fusca (Beetle, Brazilian market) in an interactive 3D
viewer: chassis year, wheels, steering wheel, suspension height, exterior color, interior,
and engine, plus one-click style presets (Cal Look, Baja Bug, Rat Look/Patina, Resto Stock,
Rebaixado BR street, and a preset approximating the owner's real reference car). Every change
updates the live 3D model instantly. The viewer also runs as a 360° auto-rotating turntable.

Non-goals for now: photorealistic rendering, a full historically-verified parts catalog,
mobile-first layout, or a backend (everything is client-side/static data).

## 2. Architecture

```
src/
  data/fusca.ts        — static reference data (source of truth for all option lists)
  store/configStore.ts — zustand store: active config + actions (set, applyPreset, toggleAutoRotate)
  components/
    Scene.tsx           — R3F Canvas, lighting, ground, OrbitControls (incl. 360° auto-rotate)
    FuscaModel.tsx       — the car mesh, entirely driven by reading the config store
    Wheel.tsx            — wheel/tire mesh, parameterized by rim color + tire profile
    ConfigPanel.tsx      — sidebar UI: reads/writes the store, renders option lists from data/fusca.ts
  App.tsx               — layout: viewer pane (Scene + 360° toggle button) + ConfigPanel
```

Data flow is one-directional: `data/fusca.ts` (option catalogs) → `configStore` (selected ids)
→ components read the store and look up the corresponding data entries to render. Adding a new
option (e.g. a wheel style) never requires touching the store or components — only the data file
and, if it needs a *new visual behavior* (not just a new value of an existing property), the
relevant component.

## 3. Data Model (`src/data/fusca.ts`)

| Type | Fields | Notes |
|---|---|---|
| `ChassisYear` | `id, label, yearRange, bodyStyle, taillightShape, note` | `taillightShape` (`round \| square \| vertical-oval`) drives which taillight mesh `FuscaModel` renders — kept as an explicit field rather than inferred from `bodyStyle`, since taillight shape and body era don't always move together historically. |
| `WheelOption` | `id, label, rimColor, tireProfile, note` | `tireProfile` (`street \| whitewall \| offroad`) drives tire width/whitewall rendering in `Wheel.tsx`. |
| `SteeringWheelOption` | `id, label, rimMaterial, note` | Not yet visually modeled (see §6) — shown in the spec sheet only. |
| `SuspensionOption` | `id, label, rideHeightMm, note` | `rideHeightMm` is a relative offset from stock; `FuscaModel` converts it to a body Y-offset. |
| `ExteriorColor` | `id, label, hex, finish` | `finish` (`gloss \| matte \| metallic \| patina`) drives roughness/metalness on the body material. |
| `InteriorOption` | `id, label, hex, material` | Not yet visually modeled (see §6) — shown in the spec sheet only. |
| `EngineOption` | `id, label, displacementCc, parts` | Not yet visually modeled (see §6) — shown in the spec sheet only. |
| `StylePreset` | `id, label, description, config` | Bulk-applies one value per category; `configStore.applyPreset` sets all fields + `activePresetId` in one call. |

The color/trim catalog is a **hand-curated starting reference set** inspired by real Fusca
production history and known customization scenes — not scraped or verified against official
records. Treat it as a baseline, not ground truth, unless cross-checked (see §7).

## 4. Reference Vehicle

The user's own Fusca — photographed and video'd in `reference/fusca-photos/` (git-ignored;
contains the visible license plate, kept local-only) — grounds several data entries:

- **Body/era**: 1970s Brazilian Fusca 1300, `square-71-85` chassis year, vertical-oval
  taillights (amber over red, chrome ring) → `taillightShape: 'vertical-oval'`.
- **Color**: copper/burnt-orange metallic → `exteriorColors['meu-fusca-cobre']` (`#b2502d`,
  sampled from the photos, **not** an official VW factory code).
- **Wheels**: painted steel wheel with a small chrome hubcap → `wheelOptions['aco-hubcap']`.
- **Interior**: dark vinyl, sport "banana" steering wheel bar → `steeringWheelOptions['sport-banana']`.
- **Engine bay**: stock-looking air-cooled single-carb setup, not modeled in 3D yet.

These are bundled into the `meu-fusca` style preset. It's an approximation for visual
reference, not a claim of exact spec — treat it as a starting point to refine further from
the photos/video as the model gets more detailed.

## 5. 360° Turntable

`configStore.autoRotate` (default `true`) is passed straight into drei's `<OrbitControls
autoRotate autoRotateSpeed enableDamping>` in `Scene.tsx` — no custom animation loop, this is
three.js's built-in turntable behavior. A floating "⏵/⏸ 360°" button in `App.tsx` calls
`toggleAutoRotate()`. Manual drag-to-orbit keeps working in both states; damping just smooths
the transition between auto-spin and user-driven rotation.

## 6. Known Gaps / Future Work

- **Body mesh**: still primitive-geometry (spheres/boxes/cylinders), not a real Fusca mesh —
  now calibrated to real-world dimensions with distinct doors/windows/trim (see
  [.specs/3d-model.spec.md](../.specs/3d-model.spec.md)), but it's a better-fitted placeholder,
  not a faithful likeness. Next step would be a proper GLTF model, ideally with swappable parts
  per chassis year (body panels, headlight/taillight variants) instead of primitive swaps.
  No image textures yet — surface detail comes from geometry (seams, pillars, louvers) and
  clearcoat material, not UV-mapped textures.
- **Steering wheel, interior, and engine** are data-only — reflected in the spec-sheet text,
  not rendered in 3D. Would need an interior/cutaway view and an engine-bay view.
- **Factual accuracy**: colors/trim/engine data (§3) should be verified against actual VW do
  Brasil production records if exactness per year matters for the product.
- **Mobile layout**: current two-pane layout is fixed-width desktop only.
- **Share/export**: no snapshot or "share this build" link yet.

## 7. Updating Reference Data

When refining `data/fusca.ts` entries against the photos in `reference/fusca-photos/`
(or new reference material), update the entry's `note`/label to say what it's based on, and
prefer adding a new option over overwriting an existing one if the change is a specific
real-car detail rather than a general-purpose default.
