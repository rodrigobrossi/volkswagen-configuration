# 3D Model Spec — `FuscaModel.tsx` / `Wheel.tsx` / Real GLTF Models

**Status: final spec, fully implemented.** The viewer now shows **real GLTF models** (see §
"Real GLTF Models" below) for the presets/eras that have one, and falls back to the fully
config-reactive **primitive-geometry placeholder** described in the rest of this document for
everything else. Every section is marked **[implemented]**; if code ever drifts from this doc,
that's a bug in one of the two — fix whichever is wrong, don't let them diverge silently.

## Real GLTF Models — [implemented]

5 real, licensed 3D models (see [CREDITS.md](../CREDITS.md)) render in place of the primitive
body for specific style presets/eras — an actual detailed mesh beats any amount of primitive
tuning. Selection logic lives in `src/data/carModels.ts` (`pickRealModel`), rendering in
`src/components/RealCarModel.tsx`, and the decision between real/primitive in
`src/components/CarModel.tsx` (used by `Scene.tsx` in place of `FuscaModel` directly).

| Trigger | Model | File |
|---|---|---|
| `rat-look` preset | Old VW Bug (Rat Look) | `fusca-ratlook.glb` |
| `resto-stock` preset | 1968 Volkswagen Beetle | `fusca-1968.glb` |
| `meu-fusca` preset | VW 1303 "Super Beetle" (1980) | `fusca-1980.glb` |
| `oval-59-65` chassis year, no preset active | VW Typ 11 (1948) | `fusca-1948.glb` |

(The former `cal-look` preset and its `fusca-callook.glb` model were removed — the preset itself
is gone from `stylePresets`, so there is no longer a Cal Look entry in the UI.)
| `round-66-70` chassis year, no preset active | 1968 Volkswagen Beetle | `fusca-1968.glb` |
| `square-71-85` chassis year, no preset active | VW 1303 "Super Beetle" (1980) | `fusca-1980.glb` |
| Everything else (`baja-bug`, `rebaixado-br` presets; `itamar-86-96` with no preset) | — | primitive `FuscaModel` |

Priority: an **active style preset wins over chassis year** — e.g. `baja-bug` (whose
`chassisYearId` is `round-66-70`) does *not* fall back to the stock 1968 model, which would
misrepresent a raised/off-road build as a clean stock car. Chassis-year-only matching applies
only when no preset is active (freeform tweaking). `itamar-86-96` has no real model among what
was sourced — the primitive placeholder remains the only option there, and that's fine.

**Two-cars-in-one-file gotcha**: `fusca-1968.glb` bundles two separate car objects in its scene
(an artifact of the source Sketchfab upload) — one clean, one with a broken/floating geometry
chunk (confirmed visually). `RealCarModel` renders only the node named
`1968_Volkswagen_Beetle_(new)_38` (**note the underscores** — three.js's `GLTFLoader` sanitizes
node names, spaces become underscores, at load time; matching against the raw glTF JSON's name
silently fails and falls back to rendering the whole scene, i.e. both cars overlapping — this
bit once already, see `.claude/memory/context.md`).

**Per-model calibration** (`carModels.ts`, `CarModelDef.calibration`): each of the 4 files was
authored by a different artist at a different native unit scale (`fusca-1948.glb` ~1/5.6 of
meters, `fusca-1980.glb` ~1.9x meters, the other two already ~meters) and not necessarily facing
the same direction. X/Z centering and ground contact (Y) are
**computed automatically** from each object's bounding box in `RealCarModel.tsx` — only
`rotationY` and `scale` are manually tuned per model, and both were derived from logged
bounding-box numbers divided into the target `LENGTH` (below), not guessed, then confirmed by
screenshot.

**When a real model is active**: interior and (for models without their own baked-in cabin)
steering wheel rim style still update `configStore` normally, but **do not visually apply** to a
real model — no per-model geometry/material mapping exists for these yet. `ConfigPanel.tsx` shows
an inline hint (`.real-model-hint`) when this is the case, rather than hiding/disabling the
controls. **Doors, front trunk, and engine lid DO visually open** on the 2 models below with
segmented node names — see "Openable parts on real models" below. **Wheel style DOES visually
apply** on `fusca-1968.glb` and `fusca-1980.glb` — see "Real wheel swap on real models" below;
`fusca-1948.glb` and `fusca-ratlook.glb` keep their baked wheels (each is one continuous fused
shell with no separable wheel sub-mesh, confirmed by node-list dump, same reasoning as their lack
of openable parts below). **Exterior color DOES visually apply** on `fusca-1948.glb`,
`fusca-1968.glb`, and `fusca-1980.glb` — see "Body paint on real models" below;
`fusca-ratlook.glb` opts out (its rust/patina texture would just get discolored).

### Openable parts on real models — [implemented]

`fusca-1968.glb` and `fusca-1980.glb` have identifiable named nodes for their
doors/hood/engine-lid — `CarModelDef.openableParts` (`carModels.ts`) configures which node
name(s) to detach per part, driven by the same `configStore` `doorsOpen`/`frontTrunkOpen`/
`engineLidOpen` booleans as the primitive placeholder. Both lids on both models follow one
pattern (**hinge at the cabin-side top edge, rotate the outer tip up**); 1968's engine/front-trunk
`pivotZ`+`openAngle` had been set inverted (hinging at the outer tip, which swung each panel
through a huge arc and detached it — the "opening out of scope" bug) and were corrected to match
1980. `fusca-1948.glb` and `fusca-ratlook.glb` have no separable panels — `fusca-1948.glb`'s body
is one continuous shell split only at the 65,535-vertex 16-bit index cap (each ~65,532-vertex
chunk spans the whole car; there is no door/hood/trunk sub-mesh to hinge), and `fusca-ratlook.glb`
is likewise a single fused shell — so both stay static for openable parts.

Mechanism (`RealCarModel.tsx`, `riggPart()`): for each configured node, compute its own
bounding-box edge as the hinge pivot (`pivotZ`/`pivotY` per config), create a `THREE.Group` at
that pivot, and call `hinge.attach(node)` **while `node` is still attached to its original
parent** — critical: `Object3D.attach()` reads `object.parent.matrixWorld` to correctly compose
the node's new hinge-relative transform, and itself handles detaching from the old parent (via
`add()`). Manually detaching first (`node.parent.remove(node)` before calling `attach()`) nulls
`node.parent`, silently skipping that composition step — `attach()` then falls back to the
node's raw pre-parent-chain local matrix, which happens to look right for shallow nodes but
badly scrambles ones whose ancestors carry non-identity transforms (e.g. Blender/FBX-export
coordinate-system-conversion rotations baked into intermediate parent nodes, as `fusca-1968.glb`'s
`Root_37`/`Body_35` chain has) — this caused a full-car rendering corruption that was hard to
diagnose because it was visible even with all parts closed (the bug is in the static rigging,
not the open/close rotation). If a real-model door/hood/lid ever renders scrambled again, check
this first.

**Door composition (`captureNodes`) — [implemented].** These GLTFs are organised BY MATERIAL, not
by part, so a door's handle, mirror and weatherstrip/friso are SEPARATE per-side meshes that don't
move when only the painted panel hinges (reported bug: "os frisos e maçanetas permanecem no mesmo
lugar"). `OpenablePartConfig.captureNodes` lists name-substrings of those per-side meshes
(`fusca-1980.glb`: `retro_ext`, `plaquette`, `joint_porte`); `riggPart()` attaches each matching
mesh to the NEAREST door hinge by X so the whole composition swings together. Whole-mesh reparenting
(never triangle-splitting) guarantees these can't be torn — only complete per-side parts are listed.

Parts whose door portion is FUSED into a larger shared mesh are handled by `captureSplitNodes`
(`fusca-1980.glb`: `vitres` = door window baked with the fixed quarter glass; `jonc_lateral` = the
belt-line friso running the whole side through both doors and the fenders). `riggPart()`
TRIANGLE-SPLITS each named mesh by EVERY door panel's X/Z footprint (X widened by a fraction of the
door depth to reach trim that sits proud of the thin skin; Y grown up for the window above the panel),
reparenting each door's slice to its hinge and leaving the remainder (quarter glass, fender trim) in
place. Splitting is confined to these named glass/trim meshes so a cut edge is invisible and the
painted body is never touched. A `captureSplitNodes` mesh spanning both doors is cut once per door,
so one shared friso feeds both.

### Real wheel swap on real models — [implemented]

`src/components/RealWheel.tsx` loads one of 3 real, licensed wheel `.glb` models (see
CREDITS.md) and self-centers/auto-scales it to a target diameter. `wheelOptionModel` in
`src/data/wheelModels.ts` maps each of the 6 curated `wheelOptions` onto whichever of the 3 real
assets is the closest visual match (several options share a model — only 3 real wheel assets
exist). `RealWheel` also accepts an optional `tint` (from `wheelOptions[selected].rimColor`),
applied only to materials with no base-color texture, so it's a no-op on the two fully
photo-textured wheel models (mustang64, retro) and only currently affects `wheel-57cr.glb`'s
untextured rim material.

`CarModelDef.wheelMounts` (`carModels.ts`) configures, per model, which baked wheel node(s) to
hide and measure — undefined/empty means this model's wheels aren't separable from the body (only
`fusca-1968.glb` and `fusca-1980.glb` have wheelMounts; `fusca-1948.glb` and `fusca-ratlook.glb`
are each one continuous fused shell with no wheel-shaped sub-mesh at all, confirmed by dumping
their node lists directly, not assumed). Hub position and diameter are **derived at runtime**
from each mount's own baked geometry (`measureWheelMount()` in `RealCarModel.tsx`) — same
"measure the real thing, don't hardcode" precedent as the engine bay sizing itself from the
engine lid's own bounding box — rather than hardcoded per-model magic numbers.

`fusca-1968.glb` has 4 distinct per-wheel nodes (`Wheel_FL_20`/`Wheel_FR_24`/`Wheel_BL_8`/
`Wheel_BR_11`, sanitized names — see the nodeName sanitization note above), each measured with a
plain bounding box. `fusca-1980.glb`'s `roue` (front axle) and `roue_1` (rear axle) each merge
BOTH the left and right wheel's geometry into single meshes per component (jantes/pneus/etc.) —
same issue as the `porte_1` merged-door node — so `wheelMounts[].splitLeftRight: true` instead
reads each mesh's actual vertex data and splits it by world-space X sign to recover each wheel's
real hub + diameter. `roue_1` is additionally nested as `roue`'s own child node in the raw glTF
(confirmed via the raw node tree, not the sanitized name pattern one would expect) —
`measureWheelMount()` only reads each mount's own DIRECT mesh children (not a full recursive
descendant walk), which skips the nested group automatically since it's not a Mesh.

Each baked wheel mount node is permanently hidden (`.visible = false`, same toggle pattern as
`engineBayHideNodes`, but unconditional rather than tied to a door/lid state) whenever
`wheelMounts` is configured, and 4 `RealWheel` instances are rendered in its place, one per
measured hub. Left/right mirroring (so tread/spoke patterns face outward on both sides) is
decided from each hub's own measured world-X sign, not from node-name L/R labels (which aren't
reliable — `fusca-1968.glb`'s "FL"-named wheel measured on the -X side, not +X).

**Not yet visually verified** (no browser available in the environment this was built in — flag
for live tuning): each wheel model's own native axle axis (`axleRealignYaw` in `wheelModels.ts`),
whether the mirror rotation actually reads as correctly outward-facing on both sides, and the
exact Z/Y hub offset per model.

### Body paint on real models — [implemented]

`src/components/useBodyPaint.ts` repaints a real model's body-paint material(s) to match
`exteriorColors[selectedId]` (color + finish), reacting to `configStore`'s `exteriorColorId` the
same way `FuscaModel.tsx`'s `bodyMaterialProps`/`exteriorColor.hex` react for the procedural
placeholder. `CarModelDef.recolorable` (`carModels.ts`) can opt a model out entirely (see below);
otherwise the paint material(s) are found either via an explicit `CarModelDef.paintMaterialNames`
override or, when that's absent, the SAME "largest opaque non-glass mesh volume wins" heuristic
`findBodyColor()` (`RealCarModel.tsx`) uses for the engine-bay tint — kept as a separate
implementation so `findBodyColor`'s own near-black skip (needed there to avoid picking small black
interior trim over an actual textured-white paint mesh) stays untouched and that one call site
keeps behaving identically.

Per-model, confirmed by dumping each `.glb`'s materials offline (not assumed):
- `fusca-1980.glb`: paint is `Mat_0`, a flat non-textured colour (auto-detected — it's the
  material shared by essentially every exterior body panel, by far the largest volume). Recolor:
  set `material.color` directly.
- `fusca-1948.glb`: paint is `metal_schwarz`, a flat black (auto-detected — the near-black colour
  is exactly why `useBodyPaint`'s own detection does NOT skip near-black materials the way
  `findBodyColor`'s does). Recolor: set `material.color` directly.
- `fusca-1968.glb`: paint is split across TWO materials, `Paint_new` and `Body` — both reference
  the identical baked texture with a default (white) base-colour factor, confirmed offline by
  sampling that texture (average colour ~(112,88,38)/255 with high per-pixel colour variance — a
  genuine colored bake, not a neutral/grey map). Since the volume heuristic can only ever pick ONE
  dominant material, both names are pinned explicitly via `paintMaterialNames`. Recolor: drop
  `material.map` (the old bake would otherwise multiply against the new color) and set
  `material.color`.
- `fusca-ratlook.glb`: `recolorable: false`. All 8 materials are generic
  `material0000..material0007` rust/patina photo textures with nothing identifiable as a distinct
  "paint" material — tinting any of them would just discolor the weathering, undermining the "Rat
  Look / Patina" theme the model exists to represent.

Finish (`gloss | matte | metallic | patina`) maps to the same roughness/metalness pairs as
`FuscaModel.tsx`'s `bodyMaterialProps` table, minus `clearcoat` (these GLTF materials load as
plain `MeshStandardMaterial`, which has no clearcoat property).

**Cloning, not mutating, the shared material**: `RealCarModel` clones the loaded scene
(`scene.clone(true)`), but `THREE.Object3D.clone()` does not clone materials — every mounted
instance of a model shares the exact same material objects coming out of `useGLTF`'s cache unless
cloned explicitly. `useBodyPaint` clones each paint material once per mesh (flagged so later color
changes mutate the existing clone in place rather than re-cloning) and only ever touches the
clone — the pristine cached original is never mutated, so remounting a model (`CarModel.tsx`'s
`key={model.key}` fully remounts `RealCarModel` on model switch) always starts from an untouched
original with no explicit restore step needed.

### Engine block — [implemented]

`src/components/EngineBlock.tsx` loads `public/models/engine/scene.gltf` (see CREDITS.md),
self-centers (X/Z centered, Y bottom at 0), and accepts `position`/`scale`/`rotation` props so
each context can place it independently. Its materials render as authored (BaseColor + Normal +
ORM) — the scene's procedural `RoomEnvironment` map (`Scene.tsx`) gives the metallic surfaces
something to reflect, so no metalness-cap / depthTest trickery is needed. Rendered in two places,
both **only while the engine lid is open** (a closed lid isn't a true hollow enclosure, so it
can't be relied on to occlude the engine when closed):
- `FuscaModel.tsx`, in the procedural engine bay under `REAR_DECK`.
- `RealCarModel.tsx`, only for models with a configured `engineLid` openable part
  (`fusca-1968.glb` and `fusca-1980.glb`). X is centered on the lid; Y sits at
  `ENGINE_FLOOR_HEIGHT_M`; Z is **inset forward from the car's rear boundary** by
  `ENGINE_REAR_INSET_M` so the whole block clears the inward-curving tail shell and stays inside
  the chassis (verified against measured world bounding boxes — ~0.37–0.39 m of clearance).

**Engine bay enclosure — `EngineBay.tsx`.** The real body shells have no actual cavity, so an open
engine lid otherwise reveals the shell's dark interior as a black frame around the block. `EngineBay`
drops an opaque, **body-coloured** open cradle (floor + cabin-side firewall + two side walls; NO top,
NO tail-side wall) around the block. The tail is left open because a Beetle's lid hinges up at the
rear — a rear wall would sit between the viewer and the engine and read as a box bolted to the tail;
the car's own rear bodywork backs that side. The firewall is taller than the side walls to hide the
cabin seats behind the block. Footprint is derived per model from the engine-lid's own bounding box
(the lid spans the opening it covers), and the tint from `findBodyColor()` (largest opaque paint
material, sampling its texture when the base colour is white). Some models bake an inner shell that is
dark on its bay-facing side and occludes the engine (e.g. `fusca-1968.glb`'s `Object_59`); list those
in `CarModelDef.engineBayHideNodes` to hide them while the lid is open (restored on close).

### Interior merge for real models without one — [implemented]

`src/components/RealInterior.tsx` extracts the real dashboard/seats mesh (`Object_65`, material
`"Interior"`) and steering-wheel mesh (`Object_39`, same material) directly out of
`fusca-1968.glb`'s own isolated "new" car subtree — not a procedural stand-in — and re-parents
them (via `Object3D.attach()`, same technique as `riggPart()` in `RealCarModel.tsx`) into a
shared container that any model can mount. `CarModelDef.hasInterior` (default `true`) gates this
— `fusca-1980.glb`, `fusca-1948.glb`, and `fusca-ratlook.glb` (exterior-only / hollow shells,
confirmed by node lists + screenshot) are `hasInterior: false` and get `RealInterior` merged in;
`fusca-1968.glb` keeps its own baked-in cabin and is the reference the others reproduce.

**Placement is derived, not hand-anchored.** The earlier version used per-model
`interiorAnchor` fractions (`heightFraction`/`depthFraction`/`dashboardWidth`) that were guessed
and screenshot-nudged per model, and never matched the reference well. `RealInterior` now instead
reproduces the exact spatial relationship the interior has to 1968's OWN body: it measures the
whole reference car's bounding box, computes where the interior's center sits as a fraction
(0..1) of that box on each axis and how big it is relative to it, then maps that same fraction and
relative size onto each host model's own bounding box (passed in as `hostBoxMin`/`hostBoxSize`
from `RealCarModel.tsx`, in the host's group-local space). A single uniform scale keyed off the
width (X) ratio keeps proportions. Result: the interior lands at the same fraction-of-
length/width/height, and the same relative size, it occupies in the reference car — auto-adapting
to each model's dimensions with **no per-model tuning**. `interiorAnchor` was removed entirely.
`CarModelDef.interiorFlipZ` is the one optional per-model override: `true` mirrors the depth
placement and facing for a model whose geometry faces `-Z` where 1968 faces `+Z` (none of the
current three need it — 1948/1980/ratlook all share 1968's `+Z`-forward layout, verified by
screenshot).

`RealInterior` doesn't react to `steeringWheelOptions`/`interiorOptions` selections when merged
into a real model — same documented limitation as wheel/exterior-color on real models above,
not a gap specific to the interior merge. `src/components/CarInterior.tsx` (the box-primitive
dashboard/seats) still exists and is still used by the fully-procedural `FuscaModel.tsx` path —
it was only replaced for the real GLTF models above.

**R3F + Vite Fast Refresh gotcha**: components rendered inside `<Canvas>` (i.e. anything in the
`RealCarModel.tsx`/`FuscaModel.tsx` tree) don't reliably hot-reload via React Fast Refresh — Vite
patches the module, but an already-mounted R3F component instance can keep running the *old*
closure since React Three Fiber's custom reconciler isn't the one Fast Refresh integrates with.
Symptom: edited code (including new `console.log`/`useEffect` calls) silently doesn't run even
though the served module clearly contains it. Fix: force a true hard reload
(`location.reload()`, or navigate to a cache-busted URL) rather than trusting HMR when debugging
anything inside the Canvas tree.

## Real-world dimensions (source of truth — 1 Three.js unit = 1 meter) — [implemented]

| Constant | Value | Notes |
|---|---|---|
| `LENGTH` | 4.07 m | overall length |
| `WIDTH` | 1.55 m | overall body width (fenders) |
| `HEIGHT` | 1.50 m | ground to roof apex |
| `WHEELBASE` | 2.40 m | front-to-rear axle distance |
| `TRACK` | 1.30 m | left-to-right wheel-center distance (narrower than `WIDTH` — fenders bulge past the wheel centerline) |
| `WHEEL_RADIUS` | 0.32 m | tire outer radius (15" steel wheel + tire) |

These are named constants in `FuscaModel.tsx`/`Wheel.tsx`; every mesh position/scale is derived
from them (a literal value or a fraction of one) — no unrelated magic numbers. If a future GLTF
import replaces the placeholder body, these constants still apply to wheel placement, door/trunk
hinge points, and camera framing.

## Exterior body — [implemented]

The body is **4 overlapping ellipsoids, not 1** — a single symmetric shell reads as a blob/egg,
not a car (see `.claude/memory/context.md`, 2026-07-17 entry, for why):

- `LOWER_BODY` — wide, low, spans nearly the full length.
- `HOOD` — low, tapering, front. Doubles as the **front trunk lid** (see Openable Parts).
- `REAR_DECK` — low, tapering, rear, slightly taller than `HOOD`. Doubles as the **engine lid**
  (see Openable Parts).
- `CABIN` — **distinctly narrower and taller** than `LOWER_BODY`, rear-biased. The width/height
  gap between `CABIN` and `LOWER_BODY` is what creates a visible shoulder/beltline — the one
  detail that most determines whether it reads as a car. Do not collapse these back into one shell.
- **Fender arches**: a half-torus (`arc ≈ 1.1π`, standing in the Y-Z plane via
  `rotation.y = π/2`) over each wheel, body-colored, so wheels visually tie into the body instead
  of floating underneath with a gap.

All fit inside the `LENGTH`×`WIDTH`×`HEIGHT` envelope. Color/finish reactive to `exteriorColorId`.

**Glass**: windshield/side/rear glass is one nested ellipsoid (`CABIN`-fitted) split visually by
pillars — see `Pillar` in `FuscaModel.tsx`. Two side door windows (left + right only — the Fusca
is a 2-door car).

**Fixed trim**: running boards, front/rear bumpers (chrome), chrome beltline trim strip (each
side, at the `CABIN`/`LOWER_BODY` shoulder line), hood centerline seam, rear engine-lid vent
louvers (must move with the engine lid when it opens — see below).

**Lights**:
- **Headlights** (2, round, front).
- **Front turn signal indicators** (2, amber, mounted on top of the front fenders between the
  headlights and windshield — matches `reference/fusca-photos/`, not just invented).
- **Taillights** (2, shape reactive to `chassisYear.taillightShape`: `round | square |
  vertical-oval`) are **two-toned**: an amber turn-signal section over a red brake/tail section,
  stacked vertically — not a single uniform red blob. Matches the reference photos, which show
  amber-over-red taillights.

**Mirrors**: 2, mounted near the A-pillar (front edge of the door) — mount arm + housing +
dark glass face, body-colored housing reactive to `exteriorColorId`.

**Wheels**: rim geometry (not just color) varies by `wheelOptions[selected].rimStyle` — see
`Wheel.tsx`:
- `hubcap` — solid disc + raised dome center, for steel/hubcap-style wheels.
- `five-spoke` — 5 distinct radiating spokes + outer rim lip + small center hub (EMPI-style).
- `multi-spoke` — 10 thin spokes + outer rim lip + small center hub (BRM-style).
Both faces of each wheel render the spoke pattern (see `WheelFace` in `Wheel.tsx`).

## Openable parts — [implemented]

Real behavior being modeled, in Portuguese where that's the natural term:

| Part | PT term | Hinge | Opens |
|---|---|---|---|
| Front trunk lid | porta-malas | top/rear edge of `HOOD` (near the cowl) | up and forward (rotate around local X) |
| Engine lid | tampa do motor | top/front edge of `REAR_DECK` (near the cabin) | up and backward (rotate around local X) |
| Both doors | portas | front edge of the door panel (vertical axis) | outward, swinging forward (rotate around local Y) |

Rules:
- State lives in `configStore`: `doorsOpen`, `frontTrunkOpen`, `engineLidOpen` (booleans,
  default `false` — car starts closed). One `doorsOpen` boolean controls **both** doors
  symmetrically; independent left/right control is future work, not required now.
- Each openable part is its own mesh (or group of meshes, e.g. the engine lid + its vent
  louvers) wrapped in a `<group>` positioned at the hinge point, with the mesh offset from that
  group's local origin — rotating the group swings the part around the hinge, not around its
  own center. This is the same "wrap in a group positioned at the pivot" pattern already used
  for the body-lift suspension group.
- Doors need a **real door panel mesh** distinct from the body (the old crease-only
  representation — a seam line painted onto the body — cannot open, since there's nothing to
  rotate). The panel approximates the door's curved area with a flat-ish box; it won't perfectly
  seam-match the underlying curved `LOWER_BODY`/`CABIN` shells at all rotation angles — that's
  an accepted approximation for a primitive placeholder, not a bug to chase further.
  `DOOR_WIDTH` (1.01m, `FuscaModel.tsx`) is a measured real-world figure (~25% of the car's
  overall 4.07m length), originally taken from a real Beetle door model front-to-back incl. glass
  and kept as a hardcoded constant.
- No physics/collision — parts can open regardless of camera angle or each other; this is a
  visual toggle, not a simulation.
- Toggle controls live in `ConfigPanel.tsx` under an "Openable Parts" section (see
  [config-panel.spec.md](config-panel.spec.md)).

## Interior — [implemented, with a documented approximation]

This section describes `src/components/CarInterior.tsx`, the procedural box-primitive interior
— still used by `FuscaModel.tsx` only. Real GLTF models reuse the real-geometry
`RealInterior.tsx` instead (see "Interior merge for real models without one" above), which has
no color/material reactivity and isn't described by this section.

- **Dashboard**: a low dark panel spanning the cabin width at the front of the interior,
  roughly where the real dash sits (below the windshield, above the pedal area).
- **Steering wheel**: a torus (rim) + 2 spokes + column, driver's side, reactive to
  `steeringWheelOptions[selected].rimMaterial`:
  - `plastic` → black, standard tube thickness
  - `wood` → warm brown/wood-tone rim color
  - `sport` → dark grey/black, thinner tube (slimmer "banana" look)
  This is the concrete "steering wheel must be visible" requirement.
- **Seats** (driver + passenger, simplified as a cushion + backrest box pair): color reactive to
  `interiorOptions[selected].hex`.
- **Visibility is a deliberate approximation, not true occlusion**: the exterior body (§ Exterior
  body above) is 4 *solid* overlapping ellipsoids with no actual cavity anywhere — `LOWER_BODY`
  and `CABIN` together solidly fill the car's entire cross-section, so anything positioned
  "inside" is geometrically buried in opaque paint regardless of glass transparency or door
  state. Confirmed by point-in-ellipsoid math, not just by looking at a render — see
  `.claude/memory/context.md` 2026-07-17 entry. Fix shipped: all interior meshes render with
  `depthTest={false}` and a higher `renderOrder` (`INTERIOR_RENDER_ORDER` in `FuscaModel.tsx`),
  i.e. they draw on top unconditionally. This means the interior is **always visible from any
  angle**, not actually hidden by closed doors/body — an intentional "always visible" cheat, not
  a bug. Revisit only if/when the body gets real hollow geometry (GLTF rework, `docs/SDD.md` §6).
- The `ConfigPanel.tsx` spec sheet's old "not visually modeled" caveat for steering wheel and
  interior is removed — see [config-panel.spec.md](config-panel.spec.md).

## Materials — [implemented]

- **Body paint**: physical material with clearcoat (`clearcoat`, `clearcoatRoughness`) for an
  automotive-gloss look. `finish` (`gloss | matte | metallic | patina`) drives
  roughness/metalness/clearcoat intensity.
- **Glass**: dark, semi-transparent, distinct from body paint.
- **Chrome trim** (bumpers, handles, running boards): high metalness, low roughness.
- **Interior**: seats use `meshStandardMaterial` at moderate roughness (fabric/vinyl, not
  glossy); steering wheel rim material varies by `rimMaterial` per the table above.

## Accuracy criteria (vs. the reference vehicle)

- Every dimension in the table above must stay within the tolerances implied by
  `reference-vehicle.spec.md` — if reference photos/video are re-measured and a constant
  changes, update this table and the code constants together, in the same change.
- "Accurate" for this placeholder means: correct proportions (§ dimensions), a body composition
  that reads unambiguously as a Beetle silhouette (§ exterior body), and config-reactive details
  matching what's visible in `reference/fusca-photos/` (taillight shape, wheel style, steering
  wheel style). It does **not** mean pixel-accurate panel lines or a photoreal surface — that
  requires the GLTF rework tracked in `docs/SDD.md` §6, not more primitive tuning.
- When in doubt about a shape/proportion question, check the photos in
  `reference/fusca-photos/` before guessing — it's local, git-ignored, and free to consult.

## Explicitly out of scope for the placeholder

- Photoreal image textures / UV-mapped materials (needs a real mesh + texture pipeline — future GLTF work).
- Independent left/right door control, or any part opening via physics/animation easing — instant open/closed toggle only.
- Occlusion-correct interior cutaway geometry (see Interior section above).
- Engine bay detail beyond the shared `EngineBlock` + `EngineBay` (no wiring/hoses/ancillaries modeled).
