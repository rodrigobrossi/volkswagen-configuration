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
and engine, plus one-click style presets (Baja Bug, Rat Look/Patina, Resto Stock,
Rebaixado BR street, and a preset approximating the owner's real reference car). Every change
updates the live 3D model instantly. The viewer also runs as a 360° auto-rotating turntable.
Doors, the front trunk (porta-malas), and the engine lid (tampa do motor) can be opened; a
steering wheel and simplified seats are visible in the cabin, plus a visible engine block once
the engine lid is open. For 4 of the 6 style presets plus 3 chassis-year-only selections, the
viewer shows one of **5 real, licensed 3D models** (`public/models/`, see
[CREDITS.md](../CREDITS.md)) instead of the primitive body — see
[.specs/3d-model.spec.md](../.specs/3d-model.spec.md) "Real GLTF Models". 3 of those 5 real
models also have real, segmented doors/hood/engine-lid that actually open (not just the
primitive placeholder), and 2 get the procedural interior/engine merged in since they lack their
own baked-in cabin.

Non-goals for now: photorealistic rendering, a full historically-verified parts catalog,
mobile-first layout, or a backend (everything is client-side/static data).

## 2. Architecture

```
src/
  data/fusca.ts        — static reference data (source of truth for all option lists)
  data/carModels.ts    — real GLTF model metadata + pickRealModel() selection rule
  store/configStore.ts — zustand store: active config + actions (set, applyPreset,
                          toggleAutoRotate, toggleDoors, toggleFrontTrunk, toggleEngineLid)
  components/
    Scene.tsx           — R3F Canvas, lighting, ground, OrbitControls (incl. 360° auto-rotate)
    CarModel.tsx         — picks real GLTF model vs. procedural FuscaModel (Scene renders this)
    RealCarModel.tsx     — loads/calibrates one of the 5 real .glb/.gltf files via useGLTF; rigs
                            openable doors/hood/engine-lid where the source file has segmented
                            nodes for them; merges in EngineBlock/CarInterior where needed
    FuscaModel.tsx       — the procedural placeholder car mesh + openable parts + engine bay
    CarInterior.tsx       — dashboard/steering-wheel/seats, shared between FuscaModel and real
                            models lacking their own baked-in cabin
    EngineBlock.tsx       — air-cooled engine model, shared between FuscaModel and real models
                            with a working engine lid
    Wheel.tsx            — wheel/tire mesh, parameterized by rim color + tire profile (procedural path only)
    ConfigPanel.tsx      — sidebar UI: reads/writes the store, renders option lists from data/fusca.ts
  App.tsx               — layout: viewer pane (Scene + 360° toggle button) + ConfigPanel
public/models/*.glb, public/models/engine/ — the 5 real 3D models + engine model (committed —
  see CREDITS.md for licenses)
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
| `SteeringWheelOption` | `id, label, rimMaterial, note` | `rimMaterial` (`plastic \| wood \| sport`) drives the rendered steering wheel's color/thickness in `FuscaModel`. |
| `SuspensionOption` | `id, label, rideHeightMm, note` | `rideHeightMm` is a relative offset from stock; `FuscaModel` converts it to a body Y-offset. |
| `ExteriorColor` | `id, label, hex, finish` | `finish` (`gloss \| matte \| metallic \| patina`) drives roughness/metalness on the body material. |
| `InteriorOption` | `id, label, hex, material` | `hex` drives the rendered seat color in `FuscaModel`; `material` isn't yet distinguished visually (fabric vs. vinyl vs. bucket all render the same seat shape). |
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
- **Engine bay**: stock-looking air-cooled single-carb setup — a generic air-cooled engine model
  is now visible when the engine lid is open (see `EngineBlock.tsx`), not specifically this
  exact single-carb configuration.

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

- **Real models cover 7 of ~10 meaningful selections**: `cal-look`, `rat-look`, `resto-stock`,
  `meu-fusca` presets, plus freeform `oval-59-65`/`round-66-70`/`square-71-85` chassis years.
  `baja-bug`, `rebaixado-br` presets and `itamar-86-96` freeform still fall back to the primitive
  placeholder, since no sourced real model matches those. Sourcing/commissioning models for those
  would close the gap.
- **Real models don't respond to most config options**: wheel style, exterior color, and (for
  models with their own baked-in cabin) interior/steering wheel only visually apply on the
  primitive placeholder — none of the 5 `.glb` files are segmented with identifiable per-part
  material names usable consistently across all of them. See `.specs/3d-model.spec.md` "Real
  GLTF Models". `ConfigPanel` shows an inline hint when a real model is active rather than
  pretending those controls do something. **Doors/front-trunk/engine-lid opening DOES work** on
  2 of the 4 real models (`fusca-1968.glb`, `fusca-1980.glb`; the other two are single fused body
  shells with no separable panels) — see "Openable parts on real models" in the spec. Per-model material-name mapping for paint/wheel
  color (feasible for `fusca-1968.glb`, which has clear names like `Body`/`Paint_new`; much
  harder for `fusca-ratlook.glb`'s generic `material0000..0007`) is future work, not attempted.
- **Primitive body mesh**: still primitive-geometry (spheres/boxes/cylinders) for the fallback
  case — calibrated to real-world dimensions with distinct doors/windows/trim (see
  [.specs/3d-model.spec.md](../.specs/3d-model.spec.md)), but a better-fitted placeholder, not a
  faithful likeness. No image textures — surface detail comes from geometry and clearcoat
  material, not UV-mapped textures (the real GLTF models do have proper textures).
- **Interior/engine visibility is an approximation, not true occlusion**: every body shell this
  project renders (primitive and real GLTF alike) is solid with no real cavity, so the
  dashboard/seats/steering wheel/engine render with `depthTest={false}` (always on top) rather
  than being properly hidden behind closed doors/body panels. See `.specs/3d-model.spec.md`
  Interior and Engine block sections. A real fix needs either CSG (hollow the shells) or
  differently-authored source models.
- **Doors/trunk/engine lid** open instantly (no animation easing) and doors move together (no
  independent left/right control) — both explicitly out of scope for now, on both the primitive
  and real-model paths.
- **Factual accuracy**: colors/trim/engine data (§3) should be verified against actual VW do
  Brasil production records if exactness per year matters for the product.
- **Mobile layout**: current two-pane layout is fixed-width desktop only.
- **Share/export**: no snapshot or "share this build" link yet.

## 7. Updating Reference Data

When refining `data/fusca.ts` entries against the photos in `reference/fusca-photos/`
(or new reference material), update the entry's `note`/label to say what it's based on, and
prefer adding a new option over overwriting an existing one if the change is a specific
real-car detail rather than a general-purpose default.
